import type { SetType } from "@griplog/core";
import { asc, eq, isNull, max } from "drizzle-orm";

import { nowIso } from "@/db/ids";
import { routineExercises, routines, routineSets } from "@/db/schema";
import type { Db } from "@/db/types";
import { enqueueChange } from "@/features/sync/outbox";

export type RoutineInput = {
  id: string;
  name: string;
  notes: string | null;
  exercises: {
    id: string;
    exerciseId: string;
    restSeconds: number | null;
    notes: string | null;
    sets: { id: string; type: SetType; weightKg: number | null; reps: number | null }[];
  }[];
};

/** Routine rows only, without the outbox. Shared by local edits and pulled changes. */
export function writeRoutineRows(
  tx: Db,
  input: RoutineInput,
  meta: { updatedAt: string; deletedAt: string | null; position?: number },
): void {
  const exists = tx
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.id, input.id))
    .get();
  if (exists) {
    tx.update(routines)
      .set({
        name: input.name.trim(),
        notes: input.notes,
        updatedAt: meta.updatedAt,
        deletedAt: meta.deletedAt,
        ...(meta.position === undefined ? {} : { position: meta.position }),
      })
      .where(eq(routines.id, input.id))
      .run();
  } else {
    // New routines go to the bottom of the list unless the server says otherwise.
    const last = tx
      .select({ value: max(routines.position) })
      .from(routines)
      .get()?.value;
    tx.insert(routines)
      .values({
        id: input.id,
        name: input.name.trim(),
        notes: input.notes,
        position: meta.position ?? (last ?? -1) + 1,
        createdAt: meta.updatedAt,
        updatedAt: meta.updatedAt,
        deletedAt: meta.deletedAt,
      })
      .run();
  }

  tx.delete(routineExercises).where(eq(routineExercises.routineId, input.id)).run();
  input.exercises.forEach((exercise, position) => {
    tx.insert(routineExercises)
      .values({
        id: exercise.id,
        routineId: input.id,
        exerciseId: exercise.exerciseId,
        position,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })
      .run();
    exercise.sets.forEach((set, setPosition) => {
      tx.insert(routineSets)
        .values({ ...set, routineExerciseId: exercise.id, position: setPosition })
        .run();
    });
  });
}

export function saveRoutine(db: Db, input: RoutineInput): void {
  db.transaction((tx) => {
    writeRoutineRows(tx, input, { updatedAt: nowIso(), deletedAt: null });
    enqueueChange(tx, "routine", input.id);
  });
}

export function deleteRoutine(db: Db, routineId: string): void {
  const timestamp = nowIso();
  db.transaction((tx) => {
    tx.update(routines)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(routines.id, routineId))
      .run();
    enqueueChange(tx, "routine", routineId);
  });
}

export function routineListQuery(db: Db) {
  return db.query.routines.findMany({
    where: isNull(routines.deletedAt),
    orderBy: asc(routines.position),
    with: {
      exercises: {
        orderBy: asc(routineExercises.position),
        columns: { id: true },
        with: { exercise: { columns: { name: true } }, sets: { columns: { id: true } } },
      },
    },
  });
}

export type RoutineListItem = Awaited<ReturnType<typeof routineListQuery>>[number];

export function routineDetailQuery(db: Db, routineId: string) {
  return db.query.routines.findFirst({
    where: eq(routines.id, routineId),
    with: {
      exercises: {
        orderBy: asc(routineExercises.position),
        with: { exercise: true, sets: { orderBy: asc(routineSets.position) } },
      },
    },
  });
}

export type RoutineDetail = NonNullable<Awaited<ReturnType<typeof routineDetailQuery>>>;

export function getRoutineInput(db: Db, routineId: string): RoutineInput | null {
  const routine = routineDetailQuery(db, routineId).sync();
  if (!routine) return null;
  return {
    id: routine.id,
    name: routine.name,
    notes: routine.notes,
    exercises: routine.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      sets: exercise.sets.map(({ id, type, weightKg, reps }) => ({ id, type, weightKg, reps })),
    })),
  };
}
