import { SET_TYPES, type SetType, type TrackingType } from "@griplog/core";
import { createStore, type StateCreator } from "zustand";

import { newId } from "@/db/ids";
import type { PreviousSet } from "@/features/exercises/repository";

export type DraftSet = {
  id: string;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  completed: boolean;
};

export type DraftExercise = {
  id: string;
  exerciseId: string;
  name: string;
  trackingType: TrackingType;
  notes: string | null;
  restSeconds: number;
  /** Sets from the last time this exercise was done, shown as hints. */
  previous: PreviousSet[];
  sets: DraftSet[];
};

export type ActiveWorkout = {
  id: string;
  title: string;
  notes: string | null;
  routineId: string | null;
  startedAt: string;
  exercises: DraftExercise[];
};

export type RestTimer = {
  /** Epoch milliseconds, so the timer survives the app being killed. */
  startedAt: number;
  endsAt: number;
};

export type SetPatch = Partial<Omit<DraftSet, "id">>;

export type ActiveWorkoutState = {
  workout: ActiveWorkout | null;
  rest: RestTimer | null;

  start: (input: { title: string; routineId?: string | null; exercises?: DraftExercise[] }) => void;
  discard: () => void;
  rename: (title: string) => void;
  setNotes: (notes: string) => void;

  addExercises: (exercises: DraftExercise[]) => void;
  removeExercise: (exerciseId: string) => void;
  moveExercise: (exerciseId: string, direction: -1 | 1) => void;
  setExerciseNotes: (exerciseId: string, notes: string) => void;
  setRestSeconds: (exerciseId: string, seconds: number) => void;

  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: SetPatch) => void;
  cycleSetType: (exerciseId: string, setId: string) => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => void;

  startRest: (seconds: number) => void;
  adjustRest: (deltaSeconds: number) => void;
  skipRest: () => void;
};

export function emptySet(type: SetType = "normal"): DraftSet {
  return {
    id: newId(),
    type,
    weightKg: null,
    reps: null,
    rpe: null,
    durationSeconds: null,
    distanceMeters: null,
    completed: false,
  };
}

function mapExercise(
  workout: ActiveWorkout,
  exerciseId: string,
  update: (exercise: DraftExercise) => DraftExercise,
): ActiveWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => (e.id === exerciseId ? update(e) : e)),
  };
}

function mapSet(
  workout: ActiveWorkout,
  exerciseId: string,
  setId: string,
  update: (set: DraftSet) => DraftSet,
): ActiveWorkout {
  return mapExercise(workout, exerciseId, (e) => ({
    ...e,
    sets: e.sets.map((s) => (s.id === setId ? update(s) : s)),
  }));
}

/** Completing an empty set takes the previous values, like tapping the hint in Hevy. */
function fillFromPrevious(set: DraftSet, previous: PreviousSet | undefined): DraftSet {
  if (!previous) return set;
  return {
    ...set,
    weightKg: set.weightKg ?? previous.weightKg,
    reps: set.reps ?? previous.reps,
    durationSeconds: set.durationSeconds ?? previous.durationSeconds,
  };
}

export const activeWorkoutSlice: StateCreator<ActiveWorkoutState> = (set, get) => {
  /** Applies an update only while a workout is running. */
  const update = (fn: (workout: ActiveWorkout) => ActiveWorkout) =>
    set((state) => (state.workout ? { workout: fn(state.workout) } : state));

  return {
    workout: null,
    rest: null,

    start: ({ title, routineId = null, exercises = [] }) =>
      set({
        workout: {
          id: newId(),
          title,
          notes: null,
          routineId,
          startedAt: new Date().toISOString(),
          exercises,
        },
        rest: null,
      }),

    discard: () => set({ workout: null, rest: null }),

    rename: (title) => update((w) => ({ ...w, title })),

    setNotes: (notes) => update((w) => ({ ...w, notes: notes || null })),

    addExercises: (exercises) =>
      update((w) => ({ ...w, exercises: [...w.exercises, ...exercises] })),

    removeExercise: (exerciseId) =>
      update((w) => ({ ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) })),

    moveExercise: (exerciseId, direction) =>
      update((w) => {
        const from = w.exercises.findIndex((e) => e.id === exerciseId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= w.exercises.length) return w;
        const exercises = [...w.exercises];
        [exercises[from], exercises[to]] = [exercises[to]!, exercises[from]!];
        return { ...w, exercises };
      }),

    setExerciseNotes: (exerciseId, notes) =>
      update((w) => mapExercise(w, exerciseId, (e) => ({ ...e, notes: notes || null }))),

    setRestSeconds: (exerciseId, seconds) =>
      update((w) =>
        mapExercise(w, exerciseId, (e) => ({ ...e, restSeconds: Math.max(0, seconds) })),
      ),

    addSet: (exerciseId) =>
      update((w) =>
        mapExercise(w, exerciseId, (e) => {
          // New sets start from the values of the last one, which is what you usually repeat.
          const last = e.sets.at(-1);
          const next = emptySet();
          if (last) {
            next.weightKg = last.weightKg;
            next.reps = last.reps;
            next.durationSeconds = last.durationSeconds;
            next.distanceMeters = last.distanceMeters;
          }
          return { ...e, sets: [...e.sets, next] };
        }),
      ),

    removeSet: (exerciseId, setId) =>
      update((w) =>
        mapExercise(w, exerciseId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) })),
      ),

    updateSet: (exerciseId, setId, patch) =>
      update((w) => mapSet(w, exerciseId, setId, (s) => ({ ...s, ...patch }))),

    cycleSetType: (exerciseId, setId) =>
      update((w) =>
        mapSet(w, exerciseId, setId, (s) => ({
          ...s,
          type: SET_TYPES[(SET_TYPES.indexOf(s.type) + 1) % SET_TYPES.length]!,
        })),
      ),

    toggleSetCompleted: (exerciseId, setId) => {
      const exercise = get().workout?.exercises.find((e) => e.id === exerciseId);
      const index = exercise?.sets.findIndex((s) => s.id === setId) ?? -1;
      const target = exercise?.sets[index];
      if (!exercise || !target) return;

      const completing = !target.completed;
      update((w) =>
        mapSet(w, exerciseId, setId, (s) =>
          completing
            ? { ...fillFromPrevious(s, exercise.previous[index]), completed: true }
            : { ...s, completed: false },
        ),
      );
      if (completing && exercise.restSeconds > 0) get().startRest(exercise.restSeconds);
    },

    startRest: (seconds) => {
      const now = Date.now();
      set({ rest: { startedAt: now, endsAt: now + seconds * 1000 } });
    },

    adjustRest: (deltaSeconds) =>
      set((state) => {
        if (!state.rest) return state;
        const endsAt = state.rest.endsAt + deltaSeconds * 1000;
        return { rest: endsAt <= Date.now() ? null : { ...state.rest, endsAt } };
      }),

    skipRest: () => set({ rest: null }),
  };
};

/** A store without persistence, for tests and previews. */
export function createActiveWorkoutStore() {
  return createStore<ActiveWorkoutState>()(activeWorkoutSlice);
}
