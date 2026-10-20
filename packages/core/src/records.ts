import { estimateOneRepMax } from "./one-rep-max";
import { isWorkingSet, setVolume, type SetLike } from "./sets";

export const RECORD_KINDS = ["weight", "one_rep_max", "set_volume", "reps"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

/** Best value ever reached per record kind for one exercise. */
export type ExerciseBests = Partial<Record<RecordKind, number>>;

export type NewRecord = {
  kind: RecordKind;
  value: number;
  /** Index of the set inside the array passed in. */
  setIndex: number;
};

export const RECORD_LABELS: Record<RecordKind, string> = {
  weight: "Heaviest weight",
  one_rep_max: "Best 1RM",
  set_volume: "Best set volume",
  reps: "Most reps",
};

function recordValue(kind: RecordKind, set: SetLike): number | null {
  if (!isWorkingSet(set) || !set.reps || set.reps <= 0) return null;
  const weighted = set.weightKg !== null && set.weightKg > 0;
  switch (kind) {
    case "weight":
      return weighted ? set.weightKg : null;
    case "one_rep_max":
      return weighted ? estimateOneRepMax(set.weightKg, set.reps) : null;
    case "set_volume":
      return weighted ? setVolume(set) : null;
    case "reps":
      // Rep records only make sense when there is no load to beat.
      return weighted ? null : set.reps;
  }
}

/**
 * Compares one exercise's sets from a finished workout with its previous bests.
 * Returns at most one record per kind: the best set that beat the old value.
 */
export function findNewRecords(previous: ExerciseBests, sets: readonly SetLike[]): NewRecord[] {
  const records: NewRecord[] = [];
  for (const kind of RECORD_KINDS) {
    let best: NewRecord | null = null;
    for (const [setIndex, set] of sets.entries()) {
      const value = recordValue(kind, set);
      if (value === null) continue;
      if (best === null || value > best.value) best = { kind, value, setIndex };
    }
    const old = previous[kind];
    if (best !== null && (old === undefined || best.value > old)) {
      records.push(best);
    }
  }
  return records;
}

export function mergeBests(previous: ExerciseBests, records: readonly NewRecord[]): ExerciseBests {
  const next = { ...previous };
  for (const record of records) next[record.kind] = record.value;
  return next;
}
