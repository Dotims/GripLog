import {
  formatDuration,
  formatNumber,
  toDisplayWeight,
  type TrackingType,
  type WeightUnit,
} from "@griplog/core";

type SetValues = {
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

/** One line per set in history views: "80 kg × 8", "12 reps", "1m", "2.5 km · 15m". */
export function formatSetValue(
  set: SetValues,
  trackingType: TrackingType,
  unit: WeightUnit,
): string {
  switch (trackingType) {
    case "weight_reps":
      if (set.weightKg === null) return set.reps === null ? "-" : `${set.reps} reps`;
      return `${formatNumber(toDisplayWeight(set.weightKg, unit))} ${unit} × ${set.reps ?? 0}`;
    case "reps":
      return set.weightKg
        ? `+${formatNumber(toDisplayWeight(set.weightKg, unit))} ${unit} × ${set.reps ?? 0}`
        : `${set.reps ?? 0} reps`;
    case "duration":
      return set.durationSeconds === null ? "-" : formatDuration(set.durationSeconds);
    case "distance_duration": {
      const parts = [
        set.distanceMeters === null ? null : `${formatNumber(set.distanceMeters / 1000, 2)} km`,
        set.durationSeconds === null ? null : formatDuration(set.durationSeconds),
      ].filter(Boolean);
      return parts.join(" · ") || "-";
    }
  }
}
