import type {
  SyncChange,
  SyncCustomExercise,
  SyncProfile,
  SyncPushResponse,
  SyncRoutine,
  SyncWorkout,
} from "@griplog/core";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { Database, Transaction } from "../db/client";
import {
  appliedChanges,
  customExercises,
  profiles,
  routineExercises,
  routines,
  routineSets,
  sets,
  workoutExercises,
  workouts,
} from "../db/schema";

const nextVersion = sql`nextval('sync_version_seq')`;
const date = (iso: string) => new Date(iso);
const dateOrNull = (iso: string | null) => (iso === null ? null : new Date(iso));

/**
 * Last write wins: an incoming aggregate older than what the server holds is
 * dropped. Returns false when the row belongs to someone else, so a guessed
 * id can never overwrite another user's data.
 */
function canWrite(
  existing: { userId: string; updatedAt: Date } | undefined,
  userId: string,
  updatedAt: string,
): boolean {
  if (!existing) return true;
  if (existing.userId !== userId) return false;
  return existing.updatedAt.getTime() <= date(updatedAt).getTime();
}

async function upsertWorkout(
  tx: Transaction,
  userId: string,
  workout: SyncWorkout,
): Promise<boolean> {
  const [existing] = await tx
    .select({ userId: workouts.userId, updatedAt: workouts.updatedAt })
    .from(workouts)
    .where(eq(workouts.id, workout.id));
  if (!canWrite(existing, userId, workout.updatedAt)) return false;

  const row = {
    title: workout.title,
    notes: workout.notes,
    startedAt: date(workout.startedAt),
    endedAt: date(workout.endedAt),
    routineId: workout.routineId,
    source: workout.source,
    updatedAt: date(workout.updatedAt),
    deletedAt: dateOrNull(workout.deletedAt),
    version: nextVersion,
  };
  await tx
    .insert(workouts)
    .values({ id: workout.id, userId, ...row })
    .onConflictDoUpdate({ target: workouts.id, set: row });

  // The aggregate is replaced as a whole; the cascade removes the old sets.
  await tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, workout.id));
  if (workout.exercises.length > 0) {
    await tx.insert(workoutExercises).values(
      workout.exercises.map((e) => ({
        id: e.id,
        workoutId: workout.id,
        exerciseId: e.exerciseId,
        position: e.position,
        notes: e.notes,
      })),
    );
    const setRows = workout.exercises.flatMap((e) =>
      e.sets.map((s) => ({ ...s, workoutExerciseId: e.id })),
    );
    if (setRows.length > 0) await tx.insert(sets).values(setRows);
  }
  return true;
}

async function upsertRoutine(
  tx: Transaction,
  userId: string,
  routine: SyncRoutine,
): Promise<boolean> {
  const [existing] = await tx
    .select({ userId: routines.userId, updatedAt: routines.updatedAt })
    .from(routines)
    .where(eq(routines.id, routine.id));
  if (!canWrite(existing, userId, routine.updatedAt)) return false;

  const row = {
    name: routine.name,
    notes: routine.notes,
    position: routine.position,
    updatedAt: date(routine.updatedAt),
    deletedAt: dateOrNull(routine.deletedAt),
    version: nextVersion,
  };
  await tx
    .insert(routines)
    .values({ id: routine.id, userId, ...row })
    .onConflictDoUpdate({ target: routines.id, set: row });

  await tx.delete(routineExercises).where(eq(routineExercises.routineId, routine.id));
  if (routine.exercises.length > 0) {
    await tx.insert(routineExercises).values(
      routine.exercises.map((e) => ({
        id: e.id,
        routineId: routine.id,
        exerciseId: e.exerciseId,
        position: e.position,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    );
    const setRows = routine.exercises.flatMap((e) =>
      e.sets.map((s) => ({ ...s, routineExerciseId: e.id })),
    );
    if (setRows.length > 0) await tx.insert(routineSets).values(setRows);
  }
  return true;
}

async function upsertExercise(
  tx: Transaction,
  userId: string,
  exercise: SyncCustomExercise,
): Promise<boolean> {
  const [existing] = await tx
    .select({ userId: customExercises.userId, updatedAt: customExercises.updatedAt })
    .from(customExercises)
    .where(and(eq(customExercises.userId, userId), eq(customExercises.id, exercise.id)));
  if (!canWrite(existing, userId, exercise.updatedAt)) return false;

  const row = {
    name: exercise.name,
    trackingType: exercise.trackingType,
    equipment: exercise.equipment,
    primaryMuscle: exercise.primaryMuscle,
    updatedAt: date(exercise.updatedAt),
    deletedAt: dateOrNull(exercise.deletedAt),
    version: nextVersion,
  };
  await tx
    .insert(customExercises)
    .values({ id: exercise.id, userId, ...row })
    .onConflictDoUpdate({ target: [customExercises.userId, customExercises.id], set: row });
  return true;
}

async function upsertProfile(
  tx: Transaction,
  userId: string,
  profile: SyncProfile,
): Promise<boolean> {
  const [existing] = await tx
    .select({ userId: profiles.userId, updatedAt: profiles.updatedAt })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (!canWrite(existing, userId, profile.updatedAt)) return false;

  const row = { ...profile, updatedAt: date(profile.updatedAt), version: nextVersion };
  await tx
    .insert(profiles)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: profiles.userId, set: row });
  return true;
}

function applyChange(tx: Transaction, userId: string, change: SyncChange): Promise<boolean> {
  switch (change.entity) {
    case "workout":
      return upsertWorkout(tx, userId, change.data);
    case "routine":
      return upsertRoutine(tx, userId, change.data);
    case "exercise":
      return upsertExercise(tx, userId, change.data);
    case "profile":
      return upsertProfile(tx, userId, change.data);
  }
}

/**
 * Applies a batch of changes in one transaction.
 *
 * - Idempotent: every change id is recorded, so a retried request is a no-op.
 * - Atomic: if any change fails, none of the batch is kept and the phone retries it.
 * - Serialised per user with an advisory lock, so two devices pushing at once
 *   cannot interleave and version numbers follow commit order.
 */
export async function applyPush(
  db: Database,
  userId: string,
  changes: SyncChange[],
): Promise<SyncPushResponse> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);

    const ids = changes.map((c) => c.changeId);
    const seen = new Set(
      (
        await tx
          .select({ id: appliedChanges.changeId })
          .from(appliedChanges)
          .where(inArray(appliedChanges.changeId, ids))
      ).map((row) => row.id),
    );

    const response: SyncPushResponse = { applied: [], skipped: [] };
    for (const change of changes) {
      if (seen.has(change.changeId)) {
        response.skipped.push(change.changeId);
        continue;
      }
      const written = await applyChange(tx, userId, change);
      await tx.insert(appliedChanges).values({ changeId: change.changeId, userId });
      seen.add(change.changeId);
      (written ? response.applied : response.skipped).push(change.changeId);
    }
    return response;
  });
}
