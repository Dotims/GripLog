import type { SetType, TrackingType } from "@griplog/core";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { newId, nowIso } from "@/db/ids";
import { exercises, keyValue, sets, workoutExercises, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { enqueueChange } from "@/features/sync/outbox";

export type CatalogueExercise = {
  id: string;
  name: string;
  trackingType: TrackingType;
  category: string | null;
  equipment: string | null;
  level: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

const CATALOGUE_VERSION_KEY = "catalogue_version";

/**
 * Loads the bundled catalogue into SQLite. Runs once per catalogue version, as
 * one transaction, so a crash halfway leaves the old catalogue intact.
 */
export function seedCatalogue(db: Db, catalogue: readonly CatalogueExercise[], version: string) {
  const current = db.select().from(keyValue).where(eq(keyValue.key, CATALOGUE_VERSION_KEY)).get();
  if (current?.value === version) return false;

  const timestamp = nowIso();
  db.transaction((tx) => {
    for (const exercise of catalogue) {
      tx.insert(exercises)
        .values({ ...exercise, isCustom: false, createdAt: timestamp, updatedAt: timestamp })
        .onConflictDoUpdate({
          target: exercises.id,
          set: { ...exercise, updatedAt: timestamp },
        })
        .run();
    }
    tx.insert(keyValue)
      .values({ key: CATALOGUE_VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: keyValue.key, set: { value: version } })
      .run();
  });
  return true;
}

export type CustomExerciseInput = {
  name: string;
  trackingType: TrackingType;
  equipment: string | null;
  primaryMuscle: string | null;
};

export function createCustomExercise(db: Db, input: CustomExerciseInput): string {
  const id = newId();
  const timestamp = nowIso();
  db.transaction((tx) => {
    tx.insert(exercises)
      .values({
        id,
        name: input.name.trim(),
        trackingType: input.trackingType,
        equipment: input.equipment,
        primaryMuscles: input.primaryMuscle ? [input.primaryMuscle] : [],
        isCustom: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
    enqueueChange(tx, "exercise", id);
  });
  return id;
}

export function listExercisesQuery(db: Db) {
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      trackingType: exercises.trackingType,
      equipment: exercises.equipment,
      primaryMuscles: exercises.primaryMuscles,
      images: exercises.images,
      isCustom: exercises.isCustom,
    })
    .from(exercises)
    .where(isNull(exercises.deletedAt))
    .orderBy(asc(exercises.name));
}

export type ExerciseListItem = Awaited<ReturnType<typeof listExercisesQuery>>[number];

export function exerciseQuery(db: Db, id: string) {
  return db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
}

/** How many times each exercise was logged, for sorting the picker by habit. */
export function exerciseUsageQuery(db: Db) {
  return db
    .select({ exerciseId: workoutExercises.exerciseId, uses: sql<number>`count(*)` })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(isNull(workouts.deletedAt))
    .groupBy(workoutExercises.exerciseId);
}

/** Every set of one exercise, newest workout first. Feeds history, charts and progression. */
export function exerciseHistoryQuery(db: Db, exerciseId: string) {
  return db
    .select({
      workoutId: workouts.id,
      workoutTitle: workouts.title,
      startedAt: workouts.startedAt,
      setId: sets.id,
      type: sets.type,
      weightKg: sets.weightKg,
      reps: sets.reps,
      rpe: sets.rpe,
      durationSeconds: sets.durationSeconds,
      distanceMeters: sets.distanceMeters,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workoutExercises.exerciseId, exerciseId), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.startedAt), asc(workoutExercises.position), asc(sets.position));
}

export type ExerciseHistoryRow = Awaited<ReturnType<typeof exerciseHistoryQuery>>[number];

export type PreviousSet = {
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
};

/** Sets from the most recent workout with this exercise: Hevy's "previous" column. */
export function previousSets(db: Db, exerciseId: string): PreviousSet[] {
  const rows = exerciseHistoryQuery(db, exerciseId).all();
  const lastWorkoutId = rows[0]?.workoutId;
  return rows
    .filter((row) => row.workoutId === lastWorkoutId)
    .map(({ type, weightKg, reps, durationSeconds }) => ({
      type,
      weightKg,
      reps,
      durationSeconds,
    }));
}

export type ExerciseInfo = { exerciseId: string; name: string; trackingType: TrackingType };

/** Names and tracking types for a list of ids, in one query. */
export function exerciseInfoByIds(db: Db, ids: readonly string[]): Map<string, ExerciseInfo> {
  if (ids.length === 0) return new Map();
  const rows = db
    .select({ id: exercises.id, name: exercises.name, trackingType: exercises.trackingType })
    .from(exercises)
    .where(inArray(exercises.id, [...new Set(ids)]))
    .all();
  return new Map(
    rows.map((row) => [
      row.id,
      { exerciseId: row.id, name: row.name, trackingType: row.trackingType },
    ]),
  );
}
