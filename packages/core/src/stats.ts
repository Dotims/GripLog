const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Monday 00:00 local time of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

/** Calendar arithmetic, so DST shifts never move us into the wrong week. */
export function addWeeks(date: Date, weeks: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export type WeekBucket = {
  weekStart: Date;
  workouts: number;
  volumeKg: number;
  durationSeconds: number;
};

export type WorkoutStat = {
  startedAt: string;
  volumeKg: number;
  durationSeconds: number;
};

/** The last `weeks` weeks ending with the current one, oldest first, empty weeks included. */
export function weeklyBuckets(
  workouts: readonly WorkoutStat[],
  weeks: number,
  now: Date = new Date(),
): WeekBucket[] {
  const currentWeek = startOfWeek(now);
  const current = currentWeek.getTime();
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addWeeks(currentWeek, i - (weeks - 1)),
    workouts: 0,
    volumeKg: 0,
    durationSeconds: 0,
  }));
  for (const workout of workouts) {
    const weekStart = startOfWeek(new Date(workout.startedAt)).getTime();
    // Round, because DST makes some weeks an hour shorter or longer.
    const index = weeks - 1 - Math.round((current - weekStart) / WEEK_MS);
    const bucket = buckets[index];
    if (!bucket) continue;
    bucket.workouts += 1;
    bucket.volumeKg += workout.volumeKg;
    bucket.durationSeconds += workout.durationSeconds;
  }
  return buckets;
}

/**
 * Consecutive weeks with at least one workout. The current week may still be
 * empty without breaking the streak, the way Hevy counts it.
 */
export function weekStreak(startedAt: readonly string[], now: Date = new Date()): number {
  const trained = new Set(startedAt.map((iso) => startOfWeek(new Date(iso)).getTime()));
  let cursor = startOfWeek(now);
  if (!trained.has(cursor.getTime())) cursor = addWeeks(cursor, -1);
  let streak = 0;
  while (trained.has(cursor.getTime())) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}
