export const SET_TYPES = ["normal", "warmup", "dropset", "failure"] as const;
export type SetType = (typeof SET_TYPES)[number];

/** How an exercise is measured. Decides which inputs the set row shows. */
export const TRACKING_TYPES = ["weight_reps", "reps", "duration", "distance_duration"] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

/** Hard limits shared by the importer and the sync contract; anything above is a typo. */
export const SET_LIMITS = {
  maxWeightKg: 2000,
  maxReps: 1000,
} as const;

export function isWithinLimits(set: { weightKg: number | null; reps: number | null }): boolean {
  return (set.weightKg ?? 0) <= SET_LIMITS.maxWeightKg && (set.reps ?? 0) <= SET_LIMITS.maxReps;
}

export type SetLike = {
  type: SetType;
  weightKg: number | null;
  reps: number | null;
};

/** Warm-ups never count towards volume or records. */
export function isWorkingSet(set: Pick<SetLike, "type">): boolean {
  return set.type !== "warmup";
}

export function setVolume(set: SetLike): number {
  if (!isWorkingSet(set) || !set.weightKg || !set.reps) return 0;
  return set.weightKg * set.reps;
}

export function totalVolume(sets: readonly SetLike[]): number {
  return sets.reduce((sum, set) => sum + setVolume(set), 0);
}

export function workingSetCount(sets: readonly Pick<SetLike, "type">[]): number {
  return sets.filter(isWorkingSet).length;
}

/** Short label used in the set column: W, D, F or the working set number. */
export function setLabel(type: SetType, workingIndex: number): string {
  switch (type) {
    case "warmup":
      return "W";
    case "dropset":
      return "D";
    case "failure":
      return "F";
    case "normal":
      return String(workingIndex);
  }
}

/** Number shown for each set: normal sets count 1, 2, 3; other types repeat the last number. */
export function setNumbers(sets: readonly Pick<SetLike, "type">[]): number[] {
  let count = 0;
  return sets.map((set) => (set.type === "normal" ? ++count : count));
}
