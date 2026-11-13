import {
  inferTrackingType,
  isWithinLimits,
  uuidV5,
  type ImportedWorkout,
  type TrackingType,
} from "@griplog/core";
import { eq, inArray } from "drizzle-orm";

import { newId, nowIso } from "@/db/ids";
import { exercises, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { enqueueChange } from "@/features/sync/outbox";
import { rebuildRecords, writeWorkoutRows } from "@/features/workouts/repository";

import { HEVY_EXERCISE_MAP } from "./hevy-exercise-map";

export type ExerciseMatch = {
  title: string;
  /** Existing exercise to log against, or null when the import creates a custom one. */
  exerciseId: string | null;
  trackingType: TrackingType;
};

export type HevyImportPlan = {
  workouts: (ImportedWorkout & { id: string })[];
  duplicates: number;
  /** Sets dropped because their values are out of range. */
  skippedSets: number;
  setCount: number;
  matches: ExerciseMatch[];
};

export type HevyImportResult = {
  workouts: number;
  sets: number;
  createdExercises: number;
};

const workoutKey = (startedAt: string, title: string) => `${startedAt}|${title}`;
const setCount = (list: HevyImportPlan["workouts"]) =>
  list.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0);

// The server keys custom exercises per account, so a public namespace is safe for them.
const EXERCISE_NAMESPACE = "e53d8803-b8fa-4dd1-8a20-4baf2c980b55";
const hevyExerciseId = (title: string) => uuidV5(`exercise|${title}`, EXERCISE_NAMESPACE);

/** Dry run for review. The account's namespace gives a workout the same id on every phone. */
export function planHevyImport(
  db: Db,
  imported: readonly ImportedWorkout[],
  namespace: string | null = null,
): HevyImportPlan {
  const workoutId = (w: ImportedWorkout) =>
    namespace ? uuidV5(`workout|${workoutKey(w.startedAt, w.title)}`, namespace) : newId();
  const previous = db
    .select({ id: workouts.id, startedAt: workouts.startedAt, title: workouts.title })
    .from(workouts)
    .where(eq(workouts.source, "hevy"))
    .all();
  // Keys catch imports from before stable ids; ids catch workouts renamed since.
  const keys = new Set(previous.map((w) => workoutKey(w.startedAt, w.title)));
  const ids = new Set(previous.map((w) => w.id));
  const unseen: (ImportedWorkout & { id: string })[] = [];
  for (const workout of imported) {
    const key = workoutKey(workout.startedAt, workout.title);
    const id = workoutId(workout);
    if (keys.has(key) || ids.has(id)) continue;
    keys.add(key);
    ids.add(id);
    unseen.push({ ...workout, id });
  }

  // Out-of-range sets are dropped (a 2 505 kg curl), and so are exercises and workouts left empty.
  let skippedSets = 0;
  const fresh = unseen
    .map((w) => ({
      ...w,
      exercises: w.exercises
        .map((e) => {
          const sets = e.sets.filter(isWithinLimits);
          skippedSets += e.sets.length - sets.length;
          return { ...e, sets };
        })
        .filter((e) => e.sets.length > 0),
    }))
    .filter((w) => w.exercises.length > 0);

  const setsByTitle = new Map<string, ImportedWorkout["exercises"][number]["sets"]>();
  for (const workout of fresh) {
    for (const exercise of workout.exercises) {
      setsByTitle.set(exercise.title, [
        ...(setsByTitle.get(exercise.title) ?? []),
        ...exercise.sets,
      ]);
    }
  }

  const titles = [...setsByTitle.keys()];
  const mappedIds = titles.flatMap((title) => HEVY_EXERCISE_MAP[title] ?? []);
  const knownIds = new Set(
    mappedIds.length === 0
      ? []
      : db
          .select({ id: exercises.id })
          .from(exercises)
          .where(inArray(exercises.id, mappedIds))
          .all()
          .map((e) => e.id),
  );
  const customs = db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(eq(exercises.isCustom, true))
    .all();
  const customByName = new Map(customs.map((e) => [e.name.toLowerCase(), e.id]));
  const customIds = new Set(customs.map((e) => e.id));

  const matches = titles.map((title): ExerciseMatch => {
    const mapped = HEVY_EXERCISE_MAP[title];
    const stable = hevyExerciseId(title);
    const exerciseId =
      (mapped && knownIds.has(mapped) ? mapped : undefined) ??
      customByName.get(title.toLowerCase()) ??
      (customIds.has(stable) ? stable : null);
    return { title, exerciseId, trackingType: inferTrackingType(setsByTitle.get(title) ?? []) };
  });

  return {
    workouts: fresh,
    duplicates: imported.length - unseen.length,
    skippedSets,
    setCount: setCount(fresh),
    matches,
  };
}

/** One transaction: a failure on any workout leaves nothing behind. */
export function runHevyImport(db: Db, plan: HevyImportPlan): HevyImportResult {
  const timestamp = nowIso();
  return db.transaction((tx) => {
    // A sync after the review may already have brought in some of these rows.
    const present = (table: typeof workouts | typeof exercises, ids: string[]) =>
      new Set(
        ids.length === 0
          ? []
          : tx
              .select({ id: table.id })
              .from(table)
              .where(inArray(table.id, ids))
              .all()
              .map((row) => row.id),
      );

    const idByTitle = new Map<string, string>();
    const toCreate = plan.matches.filter((m) => !m.exerciseId);
    const existingExercises = present(
      exercises,
      toCreate.map((m) => hevyExerciseId(m.title)),
    );
    let createdExercises = 0;
    for (const match of plan.matches) {
      const id = match.exerciseId ?? hevyExerciseId(match.title);
      idByTitle.set(match.title, id);
      if (match.exerciseId || existingExercises.has(id)) continue;
      tx.insert(exercises)
        .values({
          id,
          name: match.title,
          trackingType: match.trackingType,
          isCustom: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
      enqueueChange(tx, "exercise", id);
      createdExercises++;
    }

    const existingWorkouts = present(
      workouts,
      plan.workouts.map((w) => w.id),
    );
    const fresh = plan.workouts.filter((w) => !existingWorkouts.has(w.id));
    for (const workout of fresh) {
      writeWorkoutRows(
        tx,
        {
          id: workout.id,
          title: workout.title,
          notes: workout.description,
          startedAt: workout.startedAt,
          endedAt: workout.endedAt,
          routineId: null,
          source: "hevy",
          exercises: workout.exercises.map((exercise) => ({
            id: newId(),
            exerciseId: idByTitle.get(exercise.title)!,
            notes: exercise.notes,
            supersetId: exercise.supersetId,
            sets: exercise.sets.map((set) => ({ id: newId(), ...set })),
          })),
        },
        timestamp,
      );
      enqueueChange(tx, "workout", workout.id);
    }

    rebuildRecords(tx, [...idByTitle.values()]);
    return { workouts: fresh.length, sets: setCount(fresh), createdExercises };
  });
}
