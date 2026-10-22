/** Regions the body map can light up (react-native-body-highlighter slugs). */
export type MuscleSlug =
  | "abs"
  | "adductors"
  | "biceps"
  | "calves"
  | "chest"
  | "deltoids"
  | "forearm"
  | "gluteal"
  | "hamstring"
  | "lower-back"
  | "neck"
  | "obliques"
  | "quadriceps"
  | "trapezius"
  | "triceps"
  | "upper-back";

/** free-exercise-db muscle names to map regions. */
const REGIONS: Record<string, MuscleSlug[]> = {
  abdominals: ["abs", "obliques"],
  abductors: ["gluteal"],
  adductors: ["adductors"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  lats: ["upper-back"],
  "lower back": ["lower-back"],
  "middle back": ["upper-back"],
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  shoulders: ["deltoids"],
  traps: ["trapezius"],
  triceps: ["triceps"],
};

/** Regions drawn on the back view; the rest are on the front. */
const BACK: ReadonlySet<MuscleSlug> = new Set([
  "upper-back",
  "lower-back",
  "gluteal",
  "hamstring",
  "triceps",
]);

export type WorkedExercise = {
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
  sets: number;
};

/** 2 for the muscles that carried the session, 1 for the ones that helped. */
export type WorkedMuscle = { slug: MuscleSlug; intensity: 1 | 2 };

/**
 * Which muscles a session trained. Each set counts fully for its exercise's
 * primary muscles and half for the secondary ones; regions with at least half
 * the top score are the main ones.
 */
export function musclesWorked(exercises: readonly WorkedExercise[]): WorkedMuscle[] {
  const score = new Map<MuscleSlug, number>();
  const add = (muscles: readonly string[], weight: number) => {
    for (const muscle of muscles) {
      for (const slug of REGIONS[muscle] ?? []) {
        score.set(slug, (score.get(slug) ?? 0) + weight);
      }
    }
  };
  for (const exercise of exercises) {
    const sets = Math.max(exercise.sets, 1);
    add(exercise.primaryMuscles, sets);
    add(exercise.secondaryMuscles, sets / 2);
  }
  const top = Math.max(0, ...score.values());
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug, value]) => ({ slug, intensity: value >= top / 2 ? 2 : 1 }));
}

/** The view that shows most of the main work: a back day looks better from behind. */
export function bestSide(muscles: readonly WorkedMuscle[]): "front" | "back" {
  let front = 0;
  let back = 0;
  for (const { slug, intensity } of muscles) {
    if (intensity < 2) continue;
    if (BACK.has(slug)) back += 1;
    else front += 1;
  }
  return back > front ? "back" : "front";
}
