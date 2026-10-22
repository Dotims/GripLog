import { setVolume } from "@griplog/core";

import { newId } from "@/db/ids";
import type { ExerciseInfo, PreviousSet } from "@/features/exercises/repository";
import type { RoutineInput } from "@/features/routines/repository";
import type { WorkoutInput } from "@/features/workouts/repository";

import { emptySet, type ActiveWorkout, type DraftExercise, type DraftSet } from "./store";

/** A new exercise starts with one set; more are a tap away. */
export const DEFAULT_SET_COUNT = 1;

export type TemplateSet = Pick<DraftSet, "type" | "weightKg" | "reps"> &
  Partial<Pick<DraftSet, "durationSeconds" | "distanceMeters">> & {
    /** Top of a routine's rep range; reps is then the bottom. */
    repsMax?: number | null;
  };

export type TemplateExercise = {
  exerciseId: string;
  restSeconds: number | null;
  notes: string | null;
  supersetId?: number | null;
  sets: TemplateSet[];
};

/** A routine target becomes the set's starting value; a rep range stays a hint to beat. */
function setFromTemplate(s: TemplateSet): DraftSet {
  const range =
    s.reps !== null && s.repsMax != null && s.repsMax > s.reps
      ? { min: s.reps, max: s.repsMax }
      : null;
  return {
    ...emptySet(s.type),
    weightKg: s.weightKg,
    reps: range ? null : s.reps,
    repsRange: range,
    durationSeconds: s.durationSeconds ?? null,
    distanceMeters: s.distanceMeters ?? null,
  };
}

/** A fresh exercise block with as many sets, of the same types, as last time. */
export function newDraftExercise(
  info: ExerciseInfo,
  previous: PreviousSet[],
  restSeconds: number,
): DraftExercise {
  return {
    id: newId(),
    ...info,
    notes: null,
    restSeconds,
    supersetId: null,
    previous,
    sets:
      previous.length > 0
        ? previous.map((p) => emptySet(p.type))
        : Array.from({ length: DEFAULT_SET_COUNT }, () => emptySet()),
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
    supersetId: template.supersetId ?? null,
    previous,
    sets:
      template.sets.length > 0
        ? template.sets.map(setFromTemplate)
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
        supersetId: exercise.supersetId ?? null,
        sets: exercise.sets
          .filter((s) => s.completed)
          .map(({ completed: _completed, repsRange: _range, ...set }) => set),
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
    supersetId?: number | null;
    sets: Pick<DraftSet, "type" | "weightKg" | "reps" | "durationSeconds" | "distanceMeters">[];
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
      supersetId: exercise.supersetId ?? null,
      sets: exercise.sets.map((s) => ({
        id: newId(),
        type: s.type,
        weightKg: s.weightKg,
        reps: s.reps,
        repsMax: null,
        durationSeconds: s.durationSeconds,
        distanceMeters: s.distanceMeters,
      })),
    })),
  };
}
