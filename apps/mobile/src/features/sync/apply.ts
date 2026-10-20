import type { SyncPullResponse } from "@griplog/core";
import { eq } from "drizzle-orm";

import { exercises, keyValue, profile } from "@/db/schema";
import type { Db } from "@/db/types";
import { PROFILE_ID } from "@/features/profile/repository";
import { writeRoutineRows } from "@/features/routines/repository";
import { rebuildRecords, writeWorkoutRows } from "@/features/workouts/repository";

import { hasPendingChange } from "./outbox";

const CURSOR_KEY = "sync_cursor";

export function readCursor(db: Db): number {
  const row = db.select().from(keyValue).where(eq(keyValue.key, CURSOR_KEY)).get();
  return row ? Number(row.value) : 0;
}

/** Makes sure a pulled workout can reference an exercise this device has never seen. */
function ensureExercise(tx: Db, id: string, updatedAt: string): void {
  tx.insert(exercises)
    .values({
      id,
      name: "Unknown exercise",
      trackingType: "weight_reps",
      isCustom: true,
      createdAt: updatedAt,
      updatedAt,
    })
    .onConflictDoNothing()
    .run();
}

/**
 * Applies one page from the server and stores the new cursor in the same
 * transaction. If the app dies halfway, neither the data nor the cursor moved,
 * so the next pull fetches the same page again instead of losing it.
 *
 * Aggregates with a local edit still waiting in the outbox are skipped: the
 * local version is newer and will reach the server on the next push.
 */
export function applyPulledPage(db: Db, page: SyncPullResponse): { applied: number } {
  return db.transaction((tx) => {
    let applied = 0;
    const touchedExercises: string[] = [];

    for (const exercise of page.exercises) {
      if (hasPendingChange(tx, "exercise", exercise.id)) continue;
      const row = {
        name: exercise.name,
        trackingType: exercise.trackingType,
        equipment: exercise.equipment,
        primaryMuscles: exercise.primaryMuscle ? [exercise.primaryMuscle] : [],
        isCustom: true,
        updatedAt: exercise.updatedAt,
        deletedAt: exercise.deletedAt,
      };
      tx.insert(exercises)
        .values({ id: exercise.id, ...row, createdAt: exercise.updatedAt })
        .onConflictDoUpdate({ target: exercises.id, set: row })
        .run();
      applied++;
    }

    for (const workout of page.workouts) {
      if (hasPendingChange(tx, "workout", workout.id)) continue;
      for (const e of workout.exercises) ensureExercise(tx, e.exerciseId, workout.updatedAt);
      writeWorkoutRows(tx, workout, workout.updatedAt, workout.deletedAt);
      touchedExercises.push(...workout.exercises.map((e) => e.exerciseId));
      applied++;
    }

    for (const routine of page.routines) {
      if (hasPendingChange(tx, "routine", routine.id)) continue;
      for (const e of routine.exercises) ensureExercise(tx, e.exerciseId, routine.updatedAt);
      writeRoutineRows(tx, routine, {
        updatedAt: routine.updatedAt,
        deletedAt: routine.deletedAt,
        position: routine.position,
      });
      applied++;
    }

    if (page.profile && !hasPendingChange(tx, "profile", String(PROFILE_ID))) {
      const { firstName, lastName, bio, updatedAt } = page.profile;
      tx.update(profile)
        .set({ firstName, lastName, bio, updatedAt })
        .where(eq(profile.id, PROFILE_ID))
        .run();
      applied++;
    }

    rebuildRecords(tx, touchedExercises);
    tx.insert(keyValue)
      .values({ key: CURSOR_KEY, value: page.cursor })
      .onConflictDoUpdate({ target: keyValue.key, set: { value: page.cursor } })
      .run();
    return { applied };
  });
}
