import { describe, expect, it } from "vitest";

import { forecastGoal, weeklyGoal } from "./goals";

// Thursday 15 October 2026, local time (tests run in Europe/Warsaw).
const now = new Date(2026, 9, 15, 12, 0);
const day = (month: number, date: number) => new Date(2026, month, date, 18, 0).toISOString();
/** n workouts on the Monday..Wednesday of the week starting on that Monday. */
const week = (month: number, monday: number, n: number) =>
  Array.from({ length: n }, (_, i) => day(month, monday + i));

describe("weeklyGoal", () => {
  it("counts this week's workouts and marks the days", () => {
    const goal = weeklyGoal([day(9, 12), day(9, 14), day(9, 6)], 3, now);
    expect(goal.thisWeek).toBe(2);
    expect(goal.days).toEqual([true, false, true, false, false, false, false]);
  });

  it("does not break the streak while the current week is still open", () => {
    const history = [...week(8, 28, 3), ...week(9, 5, 3), day(9, 12)];
    const goal = weeklyGoal(history, 3, now);
    expect(goal.streak).toBe(2);
    expect(goal.weeks.at(-1)?.status).toBe("current");
  });

  it("counts the current week once it meets the goal", () => {
    const goal = weeklyGoal([...week(9, 5, 2), ...week(9, 12, 2)], 2, now);
    expect(goal.streak).toBe(2);
  });

  it("breaks on a missed week without a freeze", () => {
    const history = [...week(8, 14, 3), ...week(8, 28, 3), ...week(9, 5, 3)];
    const goal = weeklyGoal(history, 3, now);
    expect(goal.streak).toBe(2);
    expect(goal.weeks.find((w) => w.weekStart.getDate() === 21)?.status).toBe("missed");
  });

  it("spends a freeze earned by four met weeks on the next miss", () => {
    const history = [
      ...week(7, 17, 2),
      ...week(7, 24, 2),
      ...week(7, 31, 2),
      ...week(8, 7, 2),
      // 14 September: only one workout, frozen
      day(8, 14),
      ...week(8, 21, 2),
      ...week(8, 28, 2),
      ...week(9, 5, 2),
    ];
    const goal = weeklyGoal(history, 2, now);
    expect(goal.weeks.find((w) => w.weekStart.getDate() === 14)?.status).toBe("frozen");
    expect(goal.streak).toBe(7);
    expect(goal.freezeProgress).toBe(3);
  });

  it("has nothing to count before the first workout", () => {
    const goal = weeklyGoal([], 3, now);
    expect(goal).toMatchObject({ thisWeek: 0, streak: 0 });
    expect(goal.weeks).toHaveLength(1);
  });
});

describe("forecastGoal", () => {
  const points = [
    { performedAt: day(7, 1), oneRepMaxKg: 70 },
    { performedAt: day(7, 22), oneRepMaxKg: 76 },
    { performedAt: day(8, 12), oneRepMaxKg: 79 },
    { performedAt: day(9, 3), oneRepMaxKg: 84 },
  ];

  it("shows the best recent estimate against the target", () => {
    const forecast = forecastGoal(points, 100, now);
    expect(forecast.currentKg).toBe(84);
    expect(forecast.progress).toBeCloseTo(0.84);
    expect(forecast.reached).toBe(false);
  });

  it("extends a rising trend to the target", () => {
    const forecast = forecastGoal(points, 100, now);
    // About 0.2 kg a day from roughly 86 kg today.
    expect(forecast.expectedAt).not.toBeNull();
    const days = (forecast.expectedAt!.getTime() - now.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(40);
    expect(days).toBeLessThan(110);
  });

  it("makes no promise from a flat or falling trend", () => {
    const flat = points.map((p) => ({ ...p, oneRepMaxKg: 80 }));
    expect(forecastGoal(flat, 100, now).expectedAt).toBeNull();
  });

  it("needs a few sessions over two weeks before forecasting", () => {
    expect(forecastGoal(points.slice(-2), 100, now).expectedAt).toBeNull();
  });

  it("reports a reached target", () => {
    expect(forecastGoal(points, 80, now)).toMatchObject({ reached: true, progress: 1 });
  });
});
