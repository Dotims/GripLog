import { formatDuration, formatNumber } from "@griplog/core";

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  sessionCount: number;
  lastPerformedAt: string;
};

export type ProgressPoint = {
  performedAt: string;
  bestOneRepMax: number | null;
  topWeightKg: number;
  volumeKg: number;
};

export type Suggestion = {
  kind: string;
  weightKg: number | null;
  reps: number | null;
  reason: string;
};

export type WorkoutSummary = {
  id: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
  volumeKg: number;
  setCount: number;
  exercises: {
    name: string;
    sets: { type: string; weightKg: number | null; reps: number | null; rpe: number | null }[];
  }[];
};

const day = (iso: string) => iso.slice(0, 10);
const kg = (value: number) => `${formatNumber(value)} kg`;

/**
 * Finds an exercise by id or by name. Exact matches win, then the shortest name
 * containing every word, so "bench" picks "Barbell Bench Press" over a variation.
 */
export function findExercise(
  exercises: readonly ExerciseSummary[],
  query: string,
): ExerciseSummary | undefined {
  const wanted = query.trim().toLowerCase();
  const exact = exercises.find(
    (e) => e.exerciseId.toLowerCase() === wanted || e.name.toLowerCase() === wanted,
  );
  if (exact) return exact;
  const words = wanted.split(/\s+/).filter(Boolean);
  return exercises
    .filter((e) => words.every((w) => e.name.toLowerCase().includes(w)))
    .sort((a, b) => b.sessionCount - a.sessionCount || a.name.length - b.name.length)[0];
}

export function formatExerciseList(exercises: readonly ExerciseSummary[]): string {
  if (exercises.length === 0) return "No exercises logged yet.";
  return exercises
    .map(
      (e) =>
        `- ${e.name} (id ${e.exerciseId}): ${e.sessionCount} sessions, last on ${day(e.lastPerformedAt)}`,
    )
    .join("\n");
}

export function formatProgress(
  name: string,
  points: readonly ProgressPoint[],
  suggestion: Suggestion,
  last = 12,
): string {
  if (points.length === 0) return `No sessions of ${name} logged yet.`;
  const rows = points
    .slice(-last)
    .map(
      (p) =>
        `| ${day(p.performedAt)} | ${kg(p.topWeightKg)} | ${p.bestOneRepMax === null ? "-" : kg(p.bestOneRepMax)} | ${kg(p.volumeKg)} |`,
    );
  const first = points.find((p) => p.bestOneRepMax !== null)?.bestOneRepMax;
  const best = Math.max(...points.map((p) => p.bestOneRepMax ?? 0));
  return [
    `# ${name}`,
    `${points.length} sessions in total, the last ${rows.length} below.`,
    first
      ? `Estimated 1RM went from ${kg(first)} to a best of ${kg(best)}.`
      : "No loaded sets, so no 1RM estimate.",
    "",
    "| Date | Top weight | Estimated 1RM | Volume |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    `Rule-based suggestion (${suggestion.kind}): ${suggestion.reason}`,
    "The numbers come from GripLog's tested training rules (Brzycki/Epley 1RM, double progression, deload after a 3 session stall). Explain them; do not recompute them.",
  ].join("\n");
}

export function formatWorkout(workout: WorkoutSummary): string {
  const lines = [
    `# ${workout.title} (${day(workout.startedAt)})`,
    `Duration ${formatDuration(workout.durationSeconds)}, volume ${kg(workout.volumeKg)}, ${workout.setCount} working sets.`,
  ];
  for (const exercise of workout.exercises) {
    lines.push("", `## ${exercise.name}`);
    for (const set of exercise.sets) {
      const load =
        set.weightKg === null ? `${set.reps ?? 0} reps` : `${kg(set.weightKg)} x ${set.reps ?? 0}`;
      lines.push(
        `- ${set.type === "normal" ? "" : `${set.type}: `}${load}${set.rpe ? ` @RPE ${set.rpe}` : ""}`,
      );
    }
  }
  return lines.join("\n");
}

export function formatWorkoutList(workouts: readonly WorkoutSummary[]): string {
  if (workouts.length === 0) return "No workouts logged yet.";
  return workouts
    .map(
      (w) =>
        `- ${day(w.startedAt)} ${w.title} (id ${w.id}): ${formatDuration(w.durationSeconds)}, ${kg(w.volumeKg)}, ` +
        `${w.setCount} sets; ${w.exercises.map((e) => e.name).join(", ")}`,
    )
    .join("\n");
}
