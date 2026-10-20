export type WeightUnit = "kg" | "lb";

const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  const value = unit === "kg" ? kg : kgToLb(kg);
  return Math.round(value * 10) / 10;
}

export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : lbToKg(value);
}

/** 12345.5 -> "12 345.5". Hand-rolled so output is identical on Hermes, Node and the web. */
export function formatNumber(value: number, maxFractionDigits = 1): string {
  const factor = 10 ** maxFractionDigits;
  const rounded = Math.round(value * factor) / factor;
  const [whole = "0", fraction] = Math.abs(rounded).toString().split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = rounded < 0 ? "-" : "";
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

export function formatWeight(kg: number, unit: WeightUnit = "kg"): string {
  return `${formatNumber(toDisplayWeight(kg, unit))} ${unit}`;
}

/** Human duration for summaries: "1h 05m", "42m", "35s". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** Clock for running timers: "4:05", "1:02:09". */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`;
  return `${minutes}:${rest}`;
}
