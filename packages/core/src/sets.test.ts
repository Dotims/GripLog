import { describe, expect, it } from "vitest";

import { setLabel, setVolume, totalVolume, workingSetCount, type SetLike } from "./sets";

const set = (overrides: Partial<SetLike>): SetLike => ({
  type: "normal",
  weightKg: 100,
  reps: 5,
  ...overrides,
});

describe("volume", () => {
  it("multiplies weight by reps", () => {
    expect(setVolume(set({}))).toBe(500);
  });

  it("ignores warm-ups and incomplete sets", () => {
    expect(setVolume(set({ type: "warmup" }))).toBe(0);
    expect(setVolume(set({ weightKg: null }))).toBe(0);
    expect(setVolume(set({ reps: null }))).toBe(0);
  });

  it("sums a workout and counts working sets", () => {
    const sets = [
      set({ type: "warmup", weightKg: 60 }),
      set({}),
      set({ type: "dropset", weightKg: 80 }),
    ];
    expect(totalVolume(sets)).toBe(900);
    expect(workingSetCount(sets)).toBe(2);
  });
});

describe("setLabel", () => {
  it("numbers normal sets and letters the rest", () => {
    expect(setLabel("normal", 3)).toBe("3");
    expect(setLabel("warmup", 1)).toBe("W");
    expect(setLabel("dropset", 1)).toBe("D");
    expect(setLabel("failure", 1)).toBe("F");
  });
});
