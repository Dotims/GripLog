import { addWeeks, startOfWeek } from "./stats";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Met weeks per earned freeze. */
export const WEEKS_PER_FREEZE = 4;

export type WeekStatus = "met" | "frozen" | "missed" | "current";

export type GoalWeek = { weekStart: Date; workouts: number; status: WeekStatus };

export type WeeklyGoal = {
  goal: number;
  /** Workouts so far this week. */
  thisWeek: number;
  /** Monday to Sunday of the current week: did you train that day. */
  days: boolean[];
  /** Weeks in a row on goal; a frozen week keeps the streak without adding to it. */
  streak: number;
  /** Met weeks banked towards the next freeze, 0 to WEEKS_PER_FREEZE. */
  freezeProgress: number;
  /** Oldest first, from the week of the first workout to the current one. */
  weeks: GoalWeek[];
};

/** Every WEEKS_PER_FREEZE met weeks earn a freeze; the current week never breaks the streak. */
export function weeklyGoal(
  startedAt: readonly string[],
  goal: number,
  now: Date = new Date(),
): WeeklyGoal {
  const target = Math.max(1, Math.round(goal));
  const current = startOfWeek(now);
  const counts = new Map<number, number>();
  const days = Array.from({ length: 7 }, () => false);
  for (const iso of startedAt) {
    const date = new Date(iso);
    const week = startOfWeek(date).getTime();
    counts.set(week, (counts.get(week) ?? 0) + 1);
    if (week === current.getTime()) days[(date.getDay() + 6) % 7] = true;
  }

  const first = counts.size > 0 ? new Date(Math.min(...counts.keys())) : current;
  const weeks: GoalWeek[] = [];
  let banked = 0;
  for (let week = first; week.getTime() <= current.getTime(); week = addWeeks(week, 1)) {
    const workouts = counts.get(week.getTime()) ?? 0;
    let status: WeekStatus;
    if (workouts >= target) {
      status = "met";
      banked = Math.min(banked + 1, WEEKS_PER_FREEZE);
    } else if (week.getTime() === current.getTime()) {
      status = "current";
    } else if (banked >= WEEKS_PER_FREEZE) {
      status = "frozen";
      banked = 0;
    } else {
      status = "missed";
      banked = 0;
    }
    weeks.push({ weekStart: week, workouts, status });
  }

  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const status = weeks[i]!.status;
    if (status === "missed") break;
    if (status === "met") streak += 1;
  }

  return {
    goal: target,
    thisWeek: counts.get(current.getTime()) ?? 0,
    days,
    streak,
    freezeProgress: banked,
    weeks,
  };
}

export type StrengthPoint = { performedAt: string; oneRepMaxKg: number };

export type GoalForecast = {
  targetKg: number;
  /** Best estimated 1RM in the recent window, the number the ring shows. */
  currentKg: number;
  /** 0 to 1. */
  progress: number;
  reached: boolean;
  /** When the recent trend crosses the target; null without a rising trend or past two years. */
  expectedAt: Date | null;
};

export const FORECAST_WINDOW_DAYS = 84;
const MAX_FORECAST_DAYS = 730;

/** Least-squares trend through each session's best 1RM in the window, extended to the target. */
export function forecastGoal(
  points: readonly StrengthPoint[],
  targetKg: number,
  now: Date = new Date(),
): GoalForecast {
  const since = now.getTime() - FORECAST_WINDOW_DAYS * DAY_MS;
  const recent = points
    .map((p) => ({ t: new Date(p.performedAt).getTime(), kg: p.oneRepMaxKg }))
    .filter((p) => p.t >= since && p.t <= now.getTime() && p.kg > 0);
  const allTimeBest = Math.max(0, ...points.map((p) => p.oneRepMaxKg));
  const currentKg = recent.length > 0 ? Math.max(...recent.map((p) => p.kg)) : allTimeBest;
  const reached = currentKg >= targetKg;
  const base = {
    targetKg,
    currentKg,
    progress: targetKg > 0 ? Math.min(1, currentKg / targetKg) : 0,
    reached,
  };
  if (reached || recent.length < 3) return { ...base, expectedAt: null };

  const span = Math.max(...recent.map((p) => p.t)) - Math.min(...recent.map((p) => p.t));
  if (span < 14 * DAY_MS) return { ...base, expectedAt: null };

  // Days from now, so the intercept is today's trend value.
  const xs = recent.map((p) => (p.t - now.getTime()) / DAY_MS);
  const ys = recent.map((p) => p.kg);
  const meanX = xs.reduce((s, x) => s + x, 0) / xs.length;
  const meanY = ys.reduce((s, y) => s + y, 0) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - meanX) * (ys[i]! - meanY);
    den += (x - meanX) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  if (slope <= 0) return { ...base, expectedAt: null };

  // Weeks off are not progress: start from the trend at the last session.
  const lastX = Math.max(...xs);
  const atLast = meanY + slope * (lastX - meanX);
  const days = Math.max(1, (targetKg - Math.max(atLast, currentKg)) / slope);
  if (days > MAX_FORECAST_DAYS) return { ...base, expectedAt: null };
  return { ...base, expectedAt: new Date(now.getTime() + Math.ceil(days) * DAY_MS) };
}
