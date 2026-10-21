import { parseCsvRecords } from "./csv";
import { SET_TYPES, type SetType, type TrackingType } from "./sets";

export type ImportedSet = {
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

export type ImportedExercise = {
  title: string;
  notes: string | null;
  /** Hevy's superset number within the workout, or null. */
  supersetId: number | null;
  sets: ImportedSet[];
};

export type ImportedWorkout = {
  title: string;
  description: string | null;
  startedAt: string;
  endedAt: string;
  exercises: ImportedExercise[];
};

export class HevyImportError extends Error {
  override name = "HevyImportError";
}

const REQUIRED_COLUMNS = [
  "title",
  "start_time",
  "end_time",
  "exercise_title",
  "set_index",
  "set_type",
];

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Hevy writes local time as "27 Sep 2026, 20:22". Returns an ISO string. */
export function parseHevyDate(value: string): string {
  const match = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}), (\d{1,2}):(\d{2})$/.exec(value.trim());
  const month = match ? MONTHS[match[2] ?? ""] : undefined;
  if (!match || month === undefined) throw new HevyImportError(`Unrecognised date "${value}"`);
  const [, day, , year, hours, minutes] = match;
  return new Date(Number(year), month, Number(day), Number(hours), Number(minutes)).toISOString();
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toSetType(value: string | undefined): SetType {
  return SET_TYPES.find((type) => type === value) ?? "normal";
}

function toImportedSet(row: Record<string, string>): ImportedSet {
  const distanceKm = toNumber(row.distance_km);
  return {
    type: toSetType(row.set_type),
    weightKg: toNumber(row.weight_kg),
    reps: toNumber(row.reps),
    rpe: toNumber(row.rpe),
    durationSeconds: toNumber(row.duration_seconds),
    distanceMeters: distanceKm === null ? null : Math.round(distanceKm * 1000),
  };
}

/**
 * Turns Hevy's "one row per set" export into workouts. A new exercise block
 * starts when the title changes or set_index goes back, because Hevy allows
 * the same exercise twice in one workout.
 */
export function parseHevyCsv(text: string): ImportedWorkout[] {
  const records = parseCsvRecords(text);
  if (records.length === 0) return [];
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in records[0]!));
  if (missing.length > 0) {
    throw new HevyImportError(`Not a Hevy export, missing columns: ${missing.join(", ")}`);
  }

  const workouts = new Map<string, ImportedWorkout>();
  let previousSetIndex = -1;

  for (const row of records) {
    const key = `${row.title}\u0000${row.start_time}`;
    let workout = workouts.get(key);
    if (!workout) {
      workout = {
        title: row.title?.trim() || "Workout",
        description: row.description?.trim() || null,
        startedAt: parseHevyDate(row.start_time ?? ""),
        endedAt: parseHevyDate(row.end_time ?? ""),
        exercises: [],
      };
      workouts.set(key, workout);
      previousSetIndex = -1;
    }

    const setIndex = toNumber(row.set_index) ?? 0;
    const current = workout.exercises.at(-1);
    const title = row.exercise_title?.trim() ?? "";
    if (!current || current.title !== title || setIndex <= previousSetIndex) {
      workout.exercises.push({
        title,
        notes: row.exercise_notes?.trim() || null,
        supersetId: toNumber(row.superset_id),
        sets: [],
      });
    }
    workout.exercises.at(-1)!.sets.push(toImportedSet(row));
    previousSetIndex = setIndex;
  }

  return [...workouts.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Guesses how an unknown exercise is measured from the sets logged for it. */
export function inferTrackingType(sets: readonly ImportedSet[]): TrackingType {
  if (sets.some((s) => s.distanceMeters !== null)) return "distance_duration";
  if (sets.some((s) => s.reps !== null && s.reps > 0)) {
    return sets.some((s) => s.weightKg !== null && s.weightKg > 0) ? "weight_reps" : "reps";
  }
  if (sets.some((s) => s.durationSeconds !== null)) return "duration";
  return "weight_reps";
}
