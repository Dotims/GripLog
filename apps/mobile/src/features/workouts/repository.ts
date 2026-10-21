import { findNewRecords, mergeBests, type ExerciseBests, type SetType } from "@griplog/core";
import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { newId, nowIso } from "@/db/ids";
import { personalRecords, sets, workoutExercises, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { enqueueChange } from "@/features/sync/outbox";

export type SetInput = {
  id: string;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

export type WorkoutInput = {
  id: string;
  title: string;
  notes: string | null;
  startedAt: string;
  endedAt: string;
  routineId: string | null;
  source: "app" | "hevy";
  exercises: {
    id: string;
    exerciseId: string;
    notes: string | null;
    sets: SetInput[];
  }[];
};

export class EmptyWorkoutError extends Error {
  override name = "EmptyWorkoutError";
  constructor() {
    super("A workout needs at least one set.");
  }
}

/**
 * Writes the workout rows only, without records or the outbox. Shared by
 * saveWorkout and the importer, which wrap it in their own transaction.
 */
export function writeWorkoutRows(
  tx: Db,
  input: WorkoutInput,
  updatedAt: string,
  deletedAt: string | null = null,
): void {
  tx.insert(workouts)
    .values({
      id: input.id,
      title: input.title.trim() || "Workout",
      notes: input.notes,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      routineId: input.routineId,
      source: input.source,
      createdAt: updatedAt,
      updatedAt,
      deletedAt,
    })
    .onConflictDoUpdate({
      target: workouts.id,
      set: {
        title: input.title.trim() || "Workout",
        notes: input.notes,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        routineId: input.routineId,
        source: input.source,
        updatedAt,
        deletedAt,
      },
    })
    .run();

  // Editing replaces the children wholesale; the cascade removes old sets and records.
  tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, input.id)).run();

  input.exercises.forEach((exercise, position) => {
    tx.insert(workoutExercises)
      .values({
        id: exercise.id,
        workoutId: input.id,
        exerciseId: exercise.exerciseId,
        position,
        notes: exercise.notes,
      })
      .run();
    exercise.sets.forEach((set, setPosition) => {
      tx.insert(sets)
        .values({ ...set, workoutExerciseId: exercise.id, position: setPosition })
        .run();
    });
  });
}

/**
 * Recomputes personal records for the given exercises from their full history.
 * Rebuilding instead of patching keeps records correct after edits, deletes
 * and imports of older workouts.
 */
export function rebuildRecords(tx: Db, exerciseIds: readonly string[]): void {
  if (exerciseIds.length === 0) return;
  const unique = [...new Set(exerciseIds)];
  tx.delete(personalRecords).where(inArray(personalRecords.exerciseId, unique)).run();

  const rows = tx
    .select({
      exerciseId: workoutExercises.exerciseId,
      workoutId: workouts.id,
      startedAt: workouts.startedAt,
      setId: sets.id,
      type: sets.type,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(inArray(workoutExercises.exerciseId, unique), isNull(workouts.deletedAt)))
    .orderBy(asc(workouts.startedAt), asc(workoutExercises.position), asc(sets.position))
    .all();

  // One group = one exercise inside one workout, all of its blocks together.
  // Map keeps insertion order, and rows come oldest first, so groups do too.
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.workoutId}:${row.exerciseId}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const bests = new Map<string, ExerciseBests>();
  for (const group of groups.values()) {
    const { exerciseId, workoutId, startedAt } = group[0]!;
    const previous = bests.get(exerciseId) ?? {};
    const records = findNewRecords(previous, group);
    for (const record of records) {
      tx.insert(personalRecords)
        .values({
          id: newId(),
          exerciseId,
          workoutId,
          setId: group[record.setIndex]!.setId,
          kind: record.kind,
          value: record.value,
          achievedAt: startedAt,
        })
        .run();
    }
    bests.set(exerciseId, mergeBests(previous, records));
  }
}

/**
 * Saves a workout with its exercises and sets, recomputes records and queues
 * the change for sync. One transaction: either all of it lands or none of it.
 */
export function saveWorkout(db: Db, input: WorkoutInput) {
  const setCount = input.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  if (setCount === 0) throw new EmptyWorkoutError();

  const updatedAt = nowIso();
  return db.transaction((tx) => {
    const before = tx
      .select({ exerciseId: workoutExercises.exerciseId })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, input.id))
      .all()
      .map((row) => row.exerciseId);

    writeWorkoutRows(tx, input, updatedAt);
    rebuildRecords(tx, [...before, ...input.exercises.map((e) => e.exerciseId)]);
    enqueueChange(tx, "workout", input.id);

    return tx.select().from(personalRecords).where(eq(personalRecords.workoutId, input.id)).all();
  });
}

/** Soft delete: the row stays as a tombstone so the deletion can sync. */
export function deleteWorkout(db: Db, workoutId: string): void {
  const timestamp = nowIso();
  db.transaction((tx) => {
    tx.update(workouts)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(workouts.id, workoutId))
      .run();
    const exerciseIds = tx
      .select({ exerciseId: workoutExercises.exerciseId })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .all()
      .map((row) => row.exerciseId);
    rebuildRecords(tx, exerciseIds);
    enqueueChange(tx, "workout", workoutId);
  });
}

export function workoutListQuery(db: Db, limit?: number) {
  const query = db.query.workouts.findMany({
    where: isNull(workouts.deletedAt),
    orderBy: desc(workouts.startedAt),
    with: {
      exercises: {
        orderBy: asc(workoutExercises.position),
        columns: { id: true, exerciseId: true },
        with: {
          exercise: { columns: { name: true, images: true } },
          sets: { columns: { type: true, weightKg: true, reps: true } },
        },
      },
      records: { columns: { id: true } },
    },
    ...(limit ? { limit } : {}),
  });
  return query;
}

export type WorkoutListItem = Awaited<ReturnType<typeof workoutListQuery>>[number];

export function workoutDetailQuery(db: Db, workoutId: string) {
  return db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
    with: {
      exercises: {
        orderBy: asc(workoutExercises.position),
        with: {
          exercise: true,
          sets: { orderBy: asc(sets.position) },
        },
      },
      records: true,
    },
  });
}

export type WorkoutDetail = NonNullable<Awaited<ReturnType<typeof workoutDetailQuery>>>;

/** Loads a saved workout back into the input shape, for editing or syncing. */
export function getWorkoutInput(db: Db, workoutId: string): WorkoutInput | null {
  const workout = workoutDetailQuery(db, workoutId).sync();
  if (!workout) return null;
  return {
    id: workout.id,
    title: workout.title,
    notes: workout.notes,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    routineId: workout.routineId,
    source: workout.source,
    exercises: workout.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        type: set.type,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        durationSeconds: set.durationSeconds,
        distanceMeters: set.distanceMeters,
      })),
    })),
  };
}

export function workoutCount(db: Db): number {
  return (
    db.select({ value: count() }).from(workouts).where(isNull(workouts.deletedAt)).get()?.value ?? 0
  );
}
