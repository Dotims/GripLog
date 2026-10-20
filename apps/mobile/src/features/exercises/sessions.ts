import { bestOneRepMax, type ExerciseSession, type TrackingType } from "@griplog/core";

import type { ExerciseHistoryRow } from "./repository";

export type HistorySession = {
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  sets: ExerciseHistoryRow[];
};

/** Groups history rows (newest first) into one entry per workout, keeping that order. */
export function groupSessions(rows: readonly ExerciseHistoryRow[]): HistorySession[] {
  const sessions = new Map<string, HistorySession>();
  for (const row of rows) {
    const session = sessions.get(row.workoutId);
    if (session) session.sets.push(row);
    else
      sessions.set(row.workoutId, {
        workoutId: row.workoutId,
        workoutTitle: row.workoutTitle,
        startedAt: row.startedAt,
        sets: [row],
      });
  }
  return [...sessions.values()];
}

/** Oldest first, as the progression rules expect. */
export function toProgressionSessions(sessions: readonly HistorySession[]): ExerciseSession[] {
  return [...sessions].reverse().map((s) => ({ performedAt: s.startedAt, sets: s.sets }));
}

/** The number charted per session: best 1RM for loaded lifts, otherwise the best reps or time. */
export function sessionScore(session: HistorySession, trackingType: TrackingType): number | null {
  switch (trackingType) {
    case "weight_reps":
      return bestOneRepMax(session.sets);
    case "reps":
      return Math.max(0, ...session.sets.map((s) => s.reps ?? 0)) || null;
    case "duration":
    case "distance_duration":
      return Math.max(0, ...session.sets.map((s) => s.durationSeconds ?? 0)) || null;
  }
}
