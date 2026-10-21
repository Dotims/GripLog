import {
  formatClock,
  formatNumber,
  fromDisplayWeight,
  toDisplayWeight,
  type TrackingType,
  type WeightUnit,
} from "@griplog/core";

import type { PreviousSet } from "@/features/exercises/repository";

import type { DraftSet, SetPatch } from "./store";

export type SetColumn = {
  key: string;
  label: string;
  /** A plain number, or seconds typed and shown as a clock ("1:30"). */
  kind: "number" | "duration";
  decimals: boolean;
  read: (
    set: Pick<DraftSet, "weightKg" | "reps" | "durationSeconds" | "distanceMeters">,
  ) => number | null;
  write: (value: number | null) => SetPatch;
};

const round = (value: number, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;

/** Which inputs a set row shows, in display units, for each way of measuring an exercise. */
export function columnsFor(trackingType: TrackingType, unit: WeightUnit): SetColumn[] {
  const weight: SetColumn = {
    key: "weight",
    label: unit,
    kind: "number",
    decimals: true,
    read: (s) => (s.weightKg === null ? null : toDisplayWeight(s.weightKg, unit)),
    write: (v) => ({ weightKg: v === null ? null : round(fromDisplayWeight(v, unit), 3) }),
  };
  const reps: SetColumn = {
    key: "reps",
    label: "reps",
    kind: "number",
    decimals: false,
    read: (s) => s.reps,
    write: (v) => ({ reps: v }),
  };
  const time: SetColumn = {
    key: "time",
    label: "time",
    kind: "duration",
    decimals: false,
    read: (s) => s.durationSeconds,
    write: (v) => ({ durationSeconds: v }),
  };

  switch (trackingType) {
    case "weight_reps":
      return [weight, reps];
    case "reps":
      return [reps];
    case "duration":
      return [time];
    case "distance_duration":
      return [
        {
          key: "km",
          label: "km",
          kind: "number",
          decimals: true,
          read: (s) => (s.distanceMeters === null ? null : round(s.distanceMeters / 1000)),
          write: (v) => ({ distanceMeters: v === null ? null : Math.round(v * 1000) }),
        },
        time,
      ];
  }
}

/** The grey hint in the "previous" column. */
export function formatPrevious(
  previous: PreviousSet | undefined,
  trackingType: TrackingType,
  unit: WeightUnit,
): string {
  if (!previous) return "-";
  switch (trackingType) {
    case "weight_reps":
      if (previous.weightKg === null || previous.reps === null) return "-";
      return `${formatNumber(toDisplayWeight(previous.weightKg, unit))} × ${previous.reps}`;
    case "reps":
      return previous.reps === null ? "-" : `× ${previous.reps}`;
    case "duration":
    case "distance_duration":
      return previous.durationSeconds === null ? "-" : formatClock(previous.durationSeconds);
  }
}
