import type { ExerciseListItem } from "./repository";

/** Every word of the query has to appear in the name, in any order: "curl dumb" finds "Dumbbell Bicep Curl". */
export function filterExercises(
  exercises: readonly ExerciseListItem[],
  query: string,
  muscle: string | null,
): ExerciseListItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return exercises.filter((exercise) => {
    if (muscle && !exercise.primaryMuscles.includes(muscle)) return false;
    const name = exercise.name.toLowerCase();
    return words.every((word) => name.includes(word));
  });
}

export function sortByUsage(
  exercises: readonly ExerciseListItem[],
  usage: ReadonlyMap<string, number>,
): ExerciseListItem[] {
  return [...exercises].sort(
    (a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name),
  );
}

/** Exercises with an animation, plus your own, the ones you logged and the common lifts. */
export function libraryExercises(
  exercises: readonly ExerciseListItem[],
  usage: ReadonlyMap<string, number>,
  hasAnimation: (id: string) => boolean,
  common: ReadonlySet<string>,
): ExerciseListItem[] {
  return exercises.filter(
    (e) => hasAnimation(e.id) || e.isCustom || usage.has(e.id) || common.has(e.id),
  );
}
