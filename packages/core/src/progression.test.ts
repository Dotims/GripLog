import { describe, expect, it } from "vitest";

import {
  isStalled,
  roundToIncrement,
  suggestNextSession,
  type ExerciseSession,
} from "./progression";

const session = (weightKg: number, reps: number[]): ExerciseSession => ({
  performedAt: "2026-10-01T10:00:00.000Z",
  sets: reps.map((r) => ({ type: "normal" as const, weightKg, reps: r })),
});

describe("suggestNextSession", () => {
  it("has nothing to say without weighted sets", () => {
    expect(suggestNextSession([]).kind).toBe("no_data");
  });

  it("adds weight once every top set reaches the top of the range", () => {
    const suggestion = suggestNextSession([session(80, [10, 10, 10])], { min: 6, max: 10 }, 2.5);
    expect(suggestion).toMatchObject({ kind: "increase_weight", weightKg: 82.5, reps: 6 });
  });

  it("asks for one more rep while still inside the range", () => {
    const suggestion = suggestNextSession([session(80, [9, 8, 7])], { min: 6, max: 10 });
    expect(suggestion).toMatchObject({ kind: "add_reps", weightKg: 80, reps: 8 });
  });

  it("never asks for fewer reps than the bottom of the range", () => {
    expect(suggestNextSession([session(80, [3, 3])], { min: 6, max: 10 }).reps).toBe(6);
  });

  it("deloads after three sessions without a better 1RM", () => {
    const sessions = [session(100, [5]), session(100, [4]), session(100, [5]), session(97.5, [5])];
    expect(isStalled(sessions)).toBe(true);
    expect(suggestNextSession(sessions)).toMatchObject({ kind: "deload", weightKg: 87.5 });
  });

  it("is not stalled when a recent session improved", () => {
    expect(
      isStalled([session(100, [5]), session(100, [5]), session(100, [6]), session(100, [5])]),
    ).toBe(false);
  });
});

describe("roundToIncrement", () => {
  it("snaps to the nearest plate step", () => {
    expect(roundToIncrement(88.9, 2.5)).toBe(90);
    expect(roundToIncrement(21.3, 2)).toBe(22);
  });
});
