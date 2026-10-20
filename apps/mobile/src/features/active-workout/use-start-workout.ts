import { useRouter } from "expo-router";

import { useDatabase } from "@/db/DatabaseProvider";
import { exerciseInfoByIds, previousSets } from "@/features/exercises/repository";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { getRoutineInput } from "@/features/routines/repository";
import { getWorkoutInput } from "@/features/workouts/repository";
import { workoutTitleForNow } from "@/lib/dates";
import { confirm } from "@/lib/dialog";

import { draftFromTemplate, type TemplateExercise } from "./draft";
import type { DraftExercise } from "./store";
import { useActiveWorkout } from "./use-active-workout";

/** Entry points for starting a workout: empty, from a routine, or repeating an old one. */
export function useStartWorkout() {
  const db = useDatabase();
  const router = useRouter();
  const { defaultRestSeconds } = usePreferences();

  const begin = (title: string, routineId: string | null, exercises: DraftExercise[]) => {
    const launch = () => {
      useActiveWorkout.getState().start({ title, routineId, exercises });
      router.push("/workout/active");
    };
    if (!useActiveWorkout.getState().workout) {
      launch();
      return;
    }
    confirm({
      title: "Workout in progress",
      message: "Starting a new one discards the workout you have not finished.",
      confirmLabel: "Discard and start",
      destructive: true,
      onConfirm: launch,
    });
  };

  const fromTemplate = (title: string, routineId: string | null, template: TemplateExercise[]) => {
    const info = exerciseInfoByIds(
      db,
      template.map((e) => e.exerciseId),
    );
    const drafts = template.flatMap((exercise) => {
      const meta = info.get(exercise.exerciseId);
      return meta
        ? [draftFromTemplate(meta, exercise, previousSets(db, meta.exerciseId), defaultRestSeconds)]
        : [];
    });
    begin(title, routineId, drafts);
  };

  return {
    resume: () => router.push("/workout/active"),

    startEmpty: () => begin(workoutTitleForNow(), null, []),

    startRoutine: (routineId: string) => {
      const routine = getRoutineInput(db, routineId);
      if (routine) fromTemplate(routine.name, routine.id, routine.exercises);
    },

    repeatWorkout: (workoutId: string) => {
      const workout = getWorkoutInput(db, workoutId);
      if (!workout) return;
      fromTemplate(
        workout.title,
        workout.routineId,
        workout.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          restSeconds: null,
          notes: e.notes,
          sets: e.sets,
        })),
      );
    },
  };
}
