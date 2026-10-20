import {
  formatNumber,
  RECORD_LABELS,
  toDisplayWeight,
  type RecordKind,
  type WeightUnit,
} from "@griplog/core";

export function formatRecordValue(kind: RecordKind, value: number, unit: WeightUnit): string {
  return kind === "reps"
    ? `${value} reps`
    : `${formatNumber(toDisplayWeight(value, unit))} ${unit}`;
}

export function recordLabel(kind: RecordKind): string {
  return RECORD_LABELS[kind];
}
