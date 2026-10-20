/** Above this many reps any 1RM estimate is noise, so we refuse to guess. */
export const MAX_REPS_FOR_ESTIMATE = 20;

export function epley(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function brzycki(weightKg: number, reps: number): number {
  return (weightKg * 36) / (37 - reps);
}

/**
 * Estimated one-rep max. Brzycki is the better fit up to 10 reps,
 * Epley above that because Brzycki blows up as reps approach 37.
 */
export function estimateOneRepMax(weightKg: number | null, reps: number | null): number | null {
  if (!weightKg || !reps || weightKg <= 0 || reps <= 0) return null;
  if (reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return weightKg;
  const estimate = reps <= 10 ? brzycki(weightKg, reps) : epley(weightKg, reps);
  return Math.round(estimate * 10) / 10;
}
