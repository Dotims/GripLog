import { bestOneRepMax, forecastGoal, weeklyGoal } from "@griplog/core";

import { useExercise, useExerciseHistory } from "@/features/exercises/hooks";
import { groupSessions } from "@/features/exercises/sessions";
import { usePreferences } from "@/features/profile/PreferencesProvider";

export function useWeeklyGoal(startedAt: readonly string[]) {
  const { weeklyGoal: goal } = usePreferences();
  return weeklyGoal(startedAt, goal);
}

export function useLiftGoal() {
  const { liftGoal } = usePreferences();
  const exerciseId = liftGoal?.exerciseId ?? "";
  const exercise = useExercise(exerciseId);
  const history = useExerciseHistory(exerciseId);
  if (!liftGoal || !exercise) return null;

  const points = groupSessions(history ?? []).flatMap((session) => {
    const best = bestOneRepMax(session.sets);
    return best ? [{ performedAt: session.startedAt, oneRepMaxKg: best }] : [];
  });
  return {
    exerciseId,
    name: exercise.name,
    ...forecastGoal(points, liftGoal.weightKg),
  };
}
