import { describe, expect, it } from "vitest";

import { brzycki, epley, estimateOneRepMax } from "./one-rep-max";

describe("estimateOneRepMax", () => {
  it("returns the weight itself for a single rep", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it("uses Brzycki up to 10 reps", () => {
    expect(estimateOneRepMax(100, 5)).toBe(112.5);
    expect(estimateOneRepMax(80, 8)).toBe(Math.round(brzycki(80, 8) * 10) / 10);
  });

  it("switches to Epley above 10 reps", () => {
    expect(estimateOneRepMax(60, 15)).toBe(epley(60, 15));
  });

  it("refuses to estimate from empty, zero or very high rep sets", () => {
    expect(estimateOneRepMax(null, 5)).toBeNull();
    expect(estimateOneRepMax(100, null)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(40, 25)).toBeNull();
  });
});
