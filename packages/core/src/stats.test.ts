import { describe, expect, it } from "vitest";

import { addWeeks, startOfWeek, weeklyBuckets, weekStreak } from "./stats";

// Thursday 15 October 2026, local time (tests run in Europe/Warsaw).
const now = new Date(2026, 9, 15, 12, 0);
const day = (month: number, date: number) => new Date(2026, month, date, 18, 0).toISOString();

describe("startOfWeek", () => {
  it("returns Monday midnight", () => {
    expect(startOfWeek(now)).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 18, 23, 59))).toEqual(new Date(2026, 9, 12));
  });

  it("steps whole weeks across the DST change", () => {
    expect(addWeeks(new Date(2026, 9, 26), -1)).toEqual(new Date(2026, 9, 19));
  });
});

describe("weeklyBuckets", () => {
  it("puts workouts into their week and keeps empty weeks", () => {
    const buckets = weeklyBuckets(
      [
        { startedAt: day(9, 13), volumeKg: 1000, durationSeconds: 3600 },
        { startedAt: day(9, 14), volumeKg: 500, durationSeconds: 1800 },
        { startedAt: day(9, 1), volumeKg: 200, durationSeconds: 600 },
        { startedAt: day(5, 1), volumeKg: 9999, durationSeconds: 1 },
      ],
      3,
      now,
    );
    expect(buckets.map((b) => b.workouts)).toEqual([1, 0, 2]);
    expect(buckets[2]).toMatchObject({ volumeKg: 1500, durationSeconds: 5400 });
  });
});

describe("weekStreak", () => {
  it("counts consecutive weeks back from now", () => {
    expect(weekStreak([day(9, 13), day(9, 6), day(8, 30), day(8, 10)], now)).toBe(3);
  });

  it("does not break while the current week is still empty", () => {
    expect(weekStreak([day(9, 6), day(8, 30)], now)).toBe(2);
  });

  it("is zero after a missed week", () => {
    expect(weekStreak([day(8, 29)], now)).toBe(0);
  });
});
