import { and, count, eq, inArray } from "drizzle-orm";
import DataLoader from "dataloader";

import type { Database } from "../db/client";
import { customExercises, follows, likes, sets, user, workoutExercises } from "../db/schema";

/** Groups rows by a key, returning one array per requested key in request order. */
function groupBy<T, K>(keys: readonly K[], rows: T[], keyOf: (row: T) => K): T[][] {
  const groups = new Map<K, T[]>(keys.map((key) => [key, []]));
  for (const row of rows) groups.get(keyOf(row))?.push(row);
  return keys.map((key) => groups.get(key) ?? []);
}

/**
 * One DataLoader per request. Resolving 20 feed cards would otherwise run one
 * query per card for its author, its exercises, their sets and its likes (the
 * N+1 problem). Loaders collect the ids asked for in one tick and fetch them
 * with a single `WHERE id IN (...)` each.
 */
export function createLoaders(db: Database, viewerId: string) {
  return {
    user: new DataLoader(async (ids: readonly string[]) => {
      const rows = await db
        .select()
        .from(user)
        .where(inArray(user.id, [...ids]));
      return ids.map(
        (id) => rows.find((row) => row.id === id) ?? new Error(`User ${id} not found`),
      );
    }),

    exercisesByWorkout: new DataLoader(async (workoutIds: readonly string[]) => {
      const rows = await db
        .select()
        .from(workoutExercises)
        .where(inArray(workoutExercises.workoutId, [...workoutIds]))
        .orderBy(workoutExercises.position);
      return groupBy(workoutIds, rows, (row) => row.workoutId);
    }),

    setsByWorkoutExercise: new DataLoader(async (ids: readonly string[]) => {
      const rows = await db
        .select()
        .from(sets)
        .where(inArray(sets.workoutExerciseId, [...ids]))
        .orderBy(sets.position);
      return groupBy(ids, rows, (row) => row.workoutExerciseId);
    }),

    likeCount: new DataLoader(async (workoutIds: readonly string[]) => {
      const rows = await db
        .select({ workoutId: likes.workoutId, value: count() })
        .from(likes)
        .where(inArray(likes.workoutId, [...workoutIds]))
        .groupBy(likes.workoutId);
      return workoutIds.map((id) => rows.find((row) => row.workoutId === id)?.value ?? 0);
    }),

    likedByViewer: new DataLoader(async (workoutIds: readonly string[]) => {
      const rows = await db
        .select({ workoutId: likes.workoutId })
        .from(likes)
        .where(and(eq(likes.userId, viewerId), inArray(likes.workoutId, [...workoutIds])));
      const liked = new Set(rows.map((row) => row.workoutId));
      return workoutIds.map((id) => liked.has(id));
    }),

    followedByViewer: new DataLoader(async (userIds: readonly string[]) => {
      const rows = await db
        .select({ id: follows.followeeId })
        .from(follows)
        .where(and(eq(follows.followerId, viewerId), inArray(follows.followeeId, [...userIds])));
      const followed = new Set(rows.map((row) => row.id));
      return userIds.map((id) => followed.has(id));
    }),

    /** Keys are "userId:exerciseId", because custom exercise ids are only unique per user. */
    customExerciseName: new DataLoader(async (keys: readonly string[]) => {
      const pairs = keys.map((key) => key.split(":") as [string, string]);
      const rows = await db
        .select({
          userId: customExercises.userId,
          id: customExercises.id,
          name: customExercises.name,
        })
        .from(customExercises)
        .where(inArray(customExercises.userId, [...new Set(pairs.map(([userId]) => userId))]));
      const names = new Map(rows.map((row) => [`${row.userId}:${row.id}`, row.name]));
      return keys.map((key) => names.get(key) ?? null);
    }),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
