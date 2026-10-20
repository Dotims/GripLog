import type { ExerciseHistoryRow } from "./repository";
import { groupSessions, sessionScore, toProgressionSessions } from "./sessions";

const row = (workoutId: string, weightKg: number, reps: number): ExerciseHistoryRow => ({
  workoutId,
  workoutTitle: workoutId,
  startedAt: `2026-10-0${workoutId.slice(-1)}T10:00:00.000Z`,
  setId: `${workoutId}-${weightKg}-${reps}`,
  type: "normal",
  weightKg,
  reps,
  rpe: null,
  durationSeconds: null,
  distanceMeters: null,
});

describe("sessions", () => {
  const rows = [row("w2", 100, 5), row("w2", 90, 8), row("w1", 80, 5)];

  it("groups rows per workout and keeps newest first", () => {
    expect(groupSessions(rows).map((s) => [s.workoutId, s.sets.length])).toEqual([
      ["w2", 2],
      ["w1", 1],
    ]);
  });

  it("reverses into oldest first for progression", () => {
    expect(toProgressionSessions(groupSessions(rows)).map((s) => s.performedAt)).toEqual([
      "2026-10-01T10:00:00.000Z",
      "2026-10-02T10:00:00.000Z",
    ]);
  });

  it("scores a loaded session by its best estimated 1RM", () => {
    expect(sessionScore(groupSessions(rows)[0]!, "weight_reps")).toBe(112.5);
  });
});
