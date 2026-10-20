export const SET_TYPES = ["normal", "warmup", "dropset", "failure"] as const;
export type SetType = (typeof SET_TYPES)[number];

/** How an exercise is measured. Decides which inputs the set row shows. */
export const TRACKING_TYPES = ["weight_reps", "reps", "duration", "distance_duration"] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

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
