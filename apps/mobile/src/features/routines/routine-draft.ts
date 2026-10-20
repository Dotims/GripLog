import type { SetType, TrackingType } from "@griplog/core";
import { create } from "zustand";

import { newId } from "@/db/ids";
import type { ExerciseInfo } from "@/features/exercises/repository";

import type { RoutineInput } from "./repository";

export type RoutineDraftSet = {
  id: string;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
};

export type RoutineDraftExercise = {
  id: string;
  exerciseId: string;
  name: string;
  trackingType: TrackingType;
  restSeconds: number | null;
  notes: string | null;
  sets: RoutineDraftSet[];
};

export type RoutineDraft = {
  id: string;
  name: string;
  notes: string | null;
  isNew: boolean;
  exercises: RoutineDraftExercise[];
};

type RoutineDraftState = {
  draft: RoutineDraft | null;
  open: (draft: RoutineDraft) => void;
  close: () => void;
  rename: (name: string) => void;
  addExercises: (exercises: ExerciseInfo[]) => void;
  removeExercise: (id: string) => void;
  moveExercise: (id: string, direction: -1 | 1) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    patch: Partial<Omit<RoutineDraftSet, "id">>,
  ) => void;
};

const blankSet = (): RoutineDraftSet => ({
  id: newId(),
  type: "normal",
  weightKg: null,
  reps: null,
});

/**
 * The routine being edited. A separate store from the running workout: it
 * only lives while the editor is open and is thrown away on cancel.
 */
export const useRoutineDraft = create<RoutineDraftState>()((set) => {
  const update = (fn: (draft: RoutineDraft) => RoutineDraft) =>
    set((state) => (state.draft ? { draft: fn(state.draft) } : state));
  const mapExercise = (id: string, fn: (e: RoutineDraftExercise) => RoutineDraftExercise) =>
    update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? fn(e) : e)) }));

  return {
    draft: null,
    open: (draft) => set({ draft }),
    close: () => set({ draft: null }),
    rename: (name) => update((d) => ({ ...d, name })),
    addExercises: (infos) =>
      update((d) => ({
        ...d,
        exercises: [
          ...d.exercises,
          ...infos.map((info) => ({
            id: newId(),
            ...info,
            restSeconds: null,
            notes: null,
            sets: [blankSet(), blankSet(), blankSet()],
          })),
        ],
      })),
    removeExercise: (id) =>
      update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) })),
    moveExercise: (id, direction) =>
      update((d) => {
        const from = d.exercises.findIndex((e) => e.id === id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= d.exercises.length) return d;
        const exercises = [...d.exercises];
        [exercises[from], exercises[to]] = [exercises[to]!, exercises[from]!];
        return { ...d, exercises };
      }),
    addSet: (exerciseId) =>
      mapExercise(exerciseId, (e) => {
        const last = e.sets.at(-1);
        return {
          ...e,
          sets: [
            ...e.sets,
            { ...blankSet(), weightKg: last?.weightKg ?? null, reps: last?.reps ?? null },
          ],
        };
      }),
    removeSet: (exerciseId, setId) =>
      mapExercise(exerciseId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) })),
    updateSet: (exerciseId, setId, patch) =>
      mapExercise(exerciseId, (e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      })),
  };
});

export function emptyRoutineDraft(): RoutineDraft {
  return { id: newId(), name: "", notes: null, isNew: true, exercises: [] };
}

export function toRoutineInputFromDraft(draft: RoutineDraft): RoutineInput {
  return {
    id: draft.id,
    name: draft.name.trim() || "Untitled routine",
    notes: draft.notes,
    exercises: draft.exercises.map(({ id, exerciseId, restSeconds, notes, sets }) => ({
      id,
      exerciseId,
      restSeconds,
      notes,
      sets,
    })),
  };
}
