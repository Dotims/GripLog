import { estimateOneRepMax } from "./one-rep-max";
import { isWorkingSet, type SetLike } from "./sets";

/** Working sets of one exercise in one workout. */
export type ExerciseSession = {
  performedAt: string;
  sets: readonly SetLike[];
};

export type RepRange = { min: number; max: number };

export type SuggestionKind = "no_data" | "increase_weight" | "add_reps" | "deload";

export type Suggestion = {
  kind: SuggestionKind;
  weightKg: number | null;
  reps: number | null;
  reason: string;
};

export const DEFAULT_REP_RANGE: RepRange = { min: 6, max: 10 };
export const DEFAULT_INCREMENT_KG = 2.5;
export const STALL_WINDOW = 3;
export const DELOAD_FACTOR = 0.9;

export function roundToIncrement(weightKg: number, incrementKg: number): number {
  return Math.round(weightKg / incrementKg) * incrementKg;
}

export function bestOneRepMax(sets: readonly SetLike[]): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (!isWorkingSet(set)) continue;
    const estimate = estimateOneRepMax(set.weightKg, set.reps);
    if (estimate !== null && (best === null || estimate > best)) best = estimate;
  }
  return best;
}

/**
 * A lift is stalled when none of the last `window` sessions beat the best
 * estimated 1RM from before them. Needs at least window + 1 sessions.
 */
export function isStalled(sessions: readonly ExerciseSession[], window = STALL_WINDOW): boolean {
  if (sessions.length < window + 1) return false;
  const before = sessions.slice(0, -window);
  const recent = sessions.slice(-window);
  const bestBefore = Math.max(...before.map((s) => bestOneRepMax(s.sets) ?? 0));
  if (bestBefore === 0) return false;
  return recent.every((s) => (bestOneRepMax(s.sets) ?? 0) <= bestBefore);
}

/**
 * Double progression: stay at a weight until every top set reaches the top of
 * the rep range, then add weight and drop back to the bottom of the range.
 * Sessions are ordered oldest first.
 */
export function suggestNextSession(
  sessions: readonly ExerciseSession[],
  repRange: RepRange = DEFAULT_REP_RANGE,
  incrementKg: number = DEFAULT_INCREMENT_KG,
): Suggestion {
  const last = sessions.at(-1);
  const working = last?.sets.filter(
    (s) => isWorkingSet(s) && s.weightKg !== null && s.weightKg > 0 && s.reps,
  );
  if (!working || working.length === 0) {
    return { kind: "no_data", weightKg: null, reps: null, reason: "No weighted sets logged yet." };
  }

  const topWeight = Math.max(...working.map((s) => s.weightKg ?? 0));
  const topSets = working.filter((s) => s.weightKg === topWeight);
  const lowestReps = Math.min(...topSets.map((s) => s.reps ?? 0));

  if (isStalled(sessions)) {
    const weightKg = roundToIncrement(topWeight * DELOAD_FACTOR, incrementKg);
    return {
      kind: "deload",
      weightKg,
      reps: repRange.max,
      reason: `No 1RM progress in the last ${STALL_WINDOW} sessions. Drop to ${weightKg} kg and build back up.`,
    };
  }

  if (lowestReps >= repRange.max) {
    const weightKg = topWeight + incrementKg;
    return {
      kind: "increase_weight",
      weightKg,
      reps: repRange.min,
      reason: `Every top set hit ${repRange.max} reps. Add ${incrementKg} kg.`,
    };
  }

  const reps = Math.min(repRange.max, Math.max(repRange.min, lowestReps + 1));
  return {
    kind: "add_reps",
    weightKg: topWeight,
    reps,
    reason: `Stay at ${topWeight} kg and aim for ${reps} reps on every set.`,
  };
}
