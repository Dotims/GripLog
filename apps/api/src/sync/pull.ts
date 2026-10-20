import type { SyncPullResponse } from "@griplog/core";
import { and, asc, eq, gt } from "drizzle-orm";

import type { Database } from "../db/client";
import {
  customExercises,
  profiles,
  routineExercises,
  routines,
  routineSets,
  sets,
  workoutExercises,
  workouts,
} from "../db/schema";

const iso = (date: Date) => date.toISOString();
const isoOrNull = (date: Date | null) => (date === null ? null : date.toISOString());

/**
 * Each entity type is paged separately. If one list was cut at `limit`, the
 * cursor may only advance to the last version of the shortest cut list:
 * anything above it in the other lists comes again on the next page, which is
 * harmless because applying an aggregate twice gives the same result.
 */
export function nextCursor(
  lists: { versions: number[]; truncated: boolean }[],
  current: number,
): number {
  const truncated = lists.filter((l) => l.truncated);
  if (truncated.length > 0) return Math.min(...truncated.map((l) => l.versions.at(-1) ?? current));
  return Math.max(current, ...lists.flatMap((l) => l.versions));
}

export async function pullChanges(
  db: Database,
  userId: string,
  cursor: number,
  limit: number,
): Promise<SyncPullResponse> {
  // One extra row tells whether the list was cut.
  const take = limit + 1;

  const workoutRows = await db.query.workouts.findMany({
    where: and(eq(workouts.userId, userId), gt(workouts.version, cursor)),
    orderBy: asc(workouts.version),
    limit: take,
    with: {
      exercises: {
        orderBy: asc(workoutExercises.position),
        with: { sets: { orderBy: asc(sets.position) } },
      },
    },
  });
  const routineRows = await db.query.routines.findMany({
    where: and(eq(routines.userId, userId), gt(routines.version, cursor)),
    orderBy: asc(routines.version),
    limit: take,
    with: {
      exercises: {
        orderBy: asc(routineExercises.position),
        with: { sets: { orderBy: asc(routineSets.position) } },
      },
    },
  });
  const exerciseRows = await db
    .select()
    .from(customExercises)
    .where(and(eq(customExercises.userId, userId), gt(customExercises.version, cursor)))
    .orderBy(asc(customExercises.version))
    .limit(take);
  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), gt(profiles.version, cursor)));

  const page = <T>(rows: T[]) => rows.slice(0, limit);
  const describe = (rows: { version: number }[]) => ({
    versions: page(rows).map((r) => r.version),
    truncated: rows.length > limit,
  });
  const lists = [describe(workoutRows), describe(routineRows), describe(exerciseRows)];
  const profileVersions = profileRow ? [{ versions: [profileRow.version], truncated: false }] : [];
  const newCursor = nextCursor([...lists, ...profileVersions], cursor);
  const upTo = <T extends { version: number }>(rows: T[]) =>
    page(rows).filter((r) => r.version <= newCursor);

  return {
    cursor: String(newCursor),
    hasMore: lists.some((l) => l.truncated),
    workouts: upTo(workoutRows).map((w) => ({
      id: w.id,
      title: w.title,
      notes: w.notes,
      startedAt: iso(w.startedAt),
      endedAt: iso(w.endedAt),
      routineId: w.routineId,
      source: w.source,
      updatedAt: iso(w.updatedAt),
      deletedAt: isoOrNull(w.deletedAt),
      exercises: w.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        position: e.position,
        notes: e.notes,
        sets: e.sets.map(({ workoutExerciseId: _parent, ...set }) => set),
      })),
    })),
    routines: upTo(routineRows).map((r) => ({
      id: r.id,
      name: r.name,
      notes: r.notes,
      position: r.position,
      updatedAt: iso(r.updatedAt),
      deletedAt: isoOrNull(r.deletedAt),
      exercises: r.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        position: e.position,
        restSeconds: e.restSeconds,
        notes: e.notes,
        sets: e.sets.map(({ routineExerciseId: _parent, ...set }) => set),
      })),
    })),
    exercises: upTo(exerciseRows).map((e) => ({
      id: e.id,
      name: e.name,
      trackingType: e.trackingType,
      equipment: e.equipment,
      primaryMuscle: e.primaryMuscle,
      updatedAt: iso(e.updatedAt),
      deletedAt: isoOrNull(e.deletedAt),
    })),
    profile:
      profileRow && profileRow.version <= newCursor
        ? {
            firstName: profileRow.firstName,
            lastName: profileRow.lastName,
            bio: profileRow.bio,
            updatedAt: iso(profileRow.updatedAt),
          }
        : null,
  };
}
