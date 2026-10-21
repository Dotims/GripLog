import {
  inferTrackingType,
  isWithinLimits,
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
  workouts: ImportedWorkout[];
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

/**
 * Works out what an import would do without writing anything, so the user can
 * review it first. Workouts imported before are skipped, which makes running
 * the same file twice harmless.
 */
export function planHevyImport(db: Db, imported: readonly ImportedWorkout[]): HevyImportPlan {
  const existing = new Set(
    db
      .select({ startedAt: workouts.startedAt, title: workouts.title })
      .from(workouts)
      .where(eq(workouts.source, "hevy"))
      .all()
      .map((w) => workoutKey(w.startedAt, w.title)),
  );
  // Sets with impossible values (a 2 505 kg curl is a typo) are dropped, and
  // exercises or workouts left empty go with them.
  let skippedSets = 0;
  const fresh = imported
    .filter((w) => !existing.has(workoutKey(w.startedAt, w.title)))
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
  const customByName = new Map(
    db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(eq(exercises.isCustom, true))
      .all()
      .map((e) => [e.name.toLowerCase(), e.id]),
  );

  const matches = titles.map((title): ExerciseMatch => {
    const mapped = HEVY_EXERCISE_MAP[title];
    const exerciseId =
      (mapped && knownIds.has(mapped) ? mapped : customByName.get(title.toLowerCase())) ?? null;
    return { title, exerciseId, trackingType: inferTrackingType(setsByTitle.get(title) ?? []) };
  });

  return {
    workouts: fresh,
    duplicates: imported.filter((w) => existing.has(workoutKey(w.startedAt, w.title))).length,
    skippedSets,
    setCount: fresh.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0),
    matches,
  };
}

/** Writes the whole import in one transaction: a failure on workout 140 leaves nothing behind. */
export function runHevyImport(db: Db, plan: HevyImportPlan): HevyImportResult {
  const timestamp = nowIso();
  return db.transaction((tx) => {
    const idByTitle = new Map<string, string>();
    let createdExercises = 0;
    for (const match of plan.matches) {
      if (match.exerciseId) {
        idByTitle.set(match.title, match.exerciseId);
        continue;
      }
      const id = newId();
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
      idByTitle.set(match.title, id);
      createdExercises++;
    }

    for (const workout of plan.workouts) {
      const id = newId();
      writeWorkoutRows(
        tx,
        {
          id,
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
      enqueueChange(tx, "workout", id);
    }

    rebuildRecords(tx, [...idByTitle.values()]);
    return { workouts: plan.workouts.length, sets: plan.setCount, createdExercises };
  });
}
