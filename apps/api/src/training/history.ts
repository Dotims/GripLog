import { catalogueName } from "@griplog/catalogue";
import type { SetLike } from "@griplog/core";
import { and, asc, count, desc, eq, isNull, max } from "drizzle-orm";

import type { Database } from "../db/client";
import { customExercises, sets, workoutExercises, workouts } from "../db/schema";

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  sessionCount: number;
  lastPerformedAt: Date;
};

/** Satisfies ExerciseSession, plus the workout id and a Date for charts. */
export type HistorySession = {
  workoutId: string;
  performedAt: string;
  performedAtDate: Date;
  sets: SetLike[];
};

export async function exerciseName(
  db: Database,
  userId: string,
  exerciseId: string,
): Promise<string> {
  const known = catalogueName(exerciseId);
  if (known) return known;
  const [custom] = await db
    .select({ name: customExercises.name })
    .from(customExercises)
    .where(and(eq(customExercises.userId, userId), eq(customExercises.id, exerciseId)));
  return custom?.name ?? "Exercise";
}

/** Every exercise the user has logged, most recent first. */
export async function exercisesDone(db: Database, userId: string): Promise<ExerciseSummary[]> {
  const rows = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      sessionCount: count(),
      lastPerformedAt: max(workouts.startedAt),
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workouts.userId, userId), isNull(workouts.deletedAt)))
    .groupBy(workoutExercises.exerciseId)
    .orderBy(desc(max(workouts.startedAt)));

  return Promise.all(
    rows.map(async (row) => ({
      exerciseId: row.exerciseId,
      name: await exerciseName(db, userId, row.exerciseId),
      sessionCount: row.sessionCount,
      lastPerformedAt: row.lastPerformedAt ?? new Date(0),
    })),
  );
}

/** One entry per workout with this exercise, oldest first, the shape the progression rules expect. */
export async function exerciseSessions(
  db: Database,
  userId: string,
  exerciseId: string,
): Promise<HistorySession[]> {
  const rows = await db
    .select({
      workoutId: workouts.id,
      startedAt: workouts.startedAt,
      type: sets.type,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workoutExercises.exerciseId, exerciseId),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(asc(workouts.startedAt), asc(workoutExercises.position), asc(sets.position));

  const sessions = new Map<string, HistorySession>();
  for (const row of rows) {
    let session = sessions.get(row.workoutId);
    if (!session) {
      session = {
        workoutId: row.workoutId,
        performedAt: row.startedAt.toISOString(),
        performedAtDate: row.startedAt,
        sets: [],
      };
      sessions.set(row.workoutId, session);
    }
    session.sets.push({ type: row.type, weightKg: row.weightKg, reps: row.reps });
  }
  return [...sessions.values()];
}
