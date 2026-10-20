import { setVolume } from "@griplog/core";

import { newId } from "@/db/ids";
import type { ExerciseInfo, PreviousSet } from "@/features/exercises/repository";
import type { RoutineInput } from "@/features/routines/repository";
import type { WorkoutInput } from "@/features/workouts/repository";

import { emptySet, type ActiveWorkout, type DraftExercise, type DraftSet } from "./store";

export const DEFAULT_SET_COUNT = 3;

export type TemplateSet = Pick<DraftSet, "type" | "weightKg" | "reps"> &
  Partial<Pick<DraftSet, "durationSeconds" | "distanceMeters">>;

export type TemplateExercise = {
  exerciseId: string;
  restSeconds: number | null;
  notes: string | null;
  sets: TemplateSet[];
};

/** A fresh exercise block, pre-filled with as many sets as last time. */
export function newDraftExercise(
  info: ExerciseInfo,
  previous: PreviousSet[],
  restSeconds: number,
): DraftExercise {
  const setCount = previous.length > 0 ? previous.length : DEFAULT_SET_COUNT;
  return {
    id: newId(),
    ...info,
    notes: null,
    restSeconds,
    previous,
    sets: Array.from({ length: setCount }, () => emptySet()),
  };
}

/** Routine targets (or an old workout's sets) become the starting values of each set. */
export function draftFromTemplate(
  info: ExerciseInfo,
  template: TemplateExercise,
  previous: PreviousSet[],
  defaultRestSeconds: number,
): DraftExercise {
  return {
    id: newId(),
    ...info,
    notes: template.notes,
    restSeconds: template.restSeconds ?? defaultRestSeconds,
    previous,
    sets:
      template.sets.length > 0
        ? template.sets.map((s) => ({
            ...emptySet(s.type),
            weightKg: s.weightKg,
            reps: s.reps,
            durationSeconds: s.durationSeconds ?? null,
            distanceMeters: s.distanceMeters ?? null,
          }))
        : Array.from({ length: DEFAULT_SET_COUNT }, () => emptySet()),
  };
}

export function completedSets(workout: ActiveWorkout): DraftSet[] {
  return workout.exercises.flatMap((e) => e.sets.filter((s) => s.completed));
}

export function incompleteSetCount(workout: ActiveWorkout): number {
  return workout.exercises.reduce((sum, e) => sum + e.sets.filter((s) => !s.completed).length, 0);
}

export function workoutTotals(workout: ActiveWorkout) {
  const done = completedSets(workout);
  return {
    sets: done.length,
    volumeKg: done.reduce((sum, s) => sum + setVolume(s), 0),
  };
}

/** Only completed sets are saved; exercises left with none are dropped. */
export function toWorkoutInput(workout: ActiveWorkout, endedAt: string): WorkoutInput {
  return {
    id: workout.id,
    title: workout.title,
    notes: workout.notes,
    startedAt: workout.startedAt,
    endedAt,
    routineId: workout.routineId,
    source: "app",
    exercises: workout.exercises
      .map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        notes: exercise.notes,
        sets: exercise.sets
          .filter((s) => s.completed)
          .map(({ completed: _completed, ...set }) => set),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

/** Turns a finished or running workout into a routine with the same sets as targets. */
export function toRoutineInput(
  name: string,
  exercises: {
    exerciseId: string;
    restSeconds: number | null;
    notes: string | null;
    sets: Pick<DraftSet, "type" | "weightKg" | "reps">[];
  }[],
): RoutineInput {
  return {
    id: newId(),
    name,
    notes: null,
    exercises: exercises.map((exercise) => ({
      id: newId(),
      exerciseId: exercise.exerciseId,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      sets: exercise.sets.map((s) => ({
        id: newId(),
        type: s.type,
        weightKg: s.weightKg,
        reps: s.reps,
      })),
    })),
  };
}
