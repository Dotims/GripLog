import type { SetType, TrackingType } from "@griplog/core";
import { create } from "zustand";

import { newId } from "@/db/ids";
import { linkWithNext, normalizeSupersets, unlink } from "@/features/active-workout/supersets";
import type { ExerciseInfo } from "@/features/exercises/repository";

import type { RoutineInput, RoutineSetInput } from "./repository";

export type RoutineDraftSet = Omit<RoutineSetInput, "id"> & { id: string };

export type RoutineDraftExercise = {
  id: string;
  exerciseId: string;
  name: string;
  trackingType: TrackingType;
  restSeconds: number | null;
  notes: string | null;
  supersetId: number | null;
  sets: RoutineDraftSet[];
};

export type RoutineDraft = {
  id: string;
  name: string;
  notes: string | null;
  isNew: boolean;
  exercises: RoutineDraftExercise[];
};

export type RoutineSetPatch = Partial<Omit<RoutineDraftSet, "id">>;

type RoutineDraftState = {
  draft: RoutineDraft | null;
  open: (draft: RoutineDraft) => void;
  close: () => void;
  rename: (name: string) => void;
  addExercises: (exercises: ExerciseInfo[]) => void;
  removeExercise: (id: string) => void;
  moveExercise: (id: string, direction: -1 | 1) => void;
  linkSuperset: (id: string) => void;
  unlinkSuperset: (id: string) => void;
  setRestSeconds: (id: string, seconds: number | null) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: RoutineSetPatch) => void;
};

const blankSet = (type: SetType = "normal"): RoutineDraftSet => ({
  id: newId(),
  type,
  weightKg: null,
  reps: null,
  repsMax: null,
  durationSeconds: null,
  distanceMeters: null,
});

/**
 * The routine being edited. A separate store from the running workout: it
 * only lives while the editor is open and is thrown away on cancel.
 */
export const useRoutineDraft = create<RoutineDraftState>()((set) => {
  const update = (fn: (draft: RoutineDraft) => RoutineDraft) =>
    set((state) => (state.draft ? { draft: fn(state.draft) } : state));
  const updateExercises = (fn: (exercises: RoutineDraftExercise[]) => RoutineDraftExercise[]) =>
    update((d) => ({ ...d, exercises: fn(d.exercises) }));
  const mapExercise = (id: string, fn: (e: RoutineDraftExercise) => RoutineDraftExercise) =>
    updateExercises((exercises) => exercises.map((e) => (e.id === id ? fn(e) : e)));

  return {
    draft: null,
    open: (draft) => set({ draft }),
    close: () => set({ draft: null }),
    rename: (name) => update((d) => ({ ...d, name })),
    addExercises: (infos) =>
      updateExercises((exercises) => [
        ...exercises,
        ...infos.map((info) => ({
          id: newId(),
          ...info,
          restSeconds: null,
          notes: null,
          supersetId: null,
          sets: [blankSet(), blankSet(), blankSet()],
        })),
      ]),
    removeExercise: (id) =>
      updateExercises((exercises) => normalizeSupersets(exercises.filter((e) => e.id !== id))),
    moveExercise: (id, direction) =>
      updateExercises((exercises) => {
        const from = exercises.findIndex((e) => e.id === id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= exercises.length) return exercises;
        const moved = [...exercises];
        [moved[from], moved[to]] = [moved[to]!, moved[from]!];
        return normalizeSupersets(moved);
      }),
    linkSuperset: (id) => updateExercises((exercises) => linkWithNext(exercises, id)),
    unlinkSuperset: (id) => updateExercises((exercises) => unlink(exercises, id)),
    setRestSeconds: (id, seconds) => mapExercise(id, (e) => ({ ...e, restSeconds: seconds })),
    addSet: (exerciseId) =>
      mapExercise(exerciseId, (e) => {
        // A new set repeats the last one's targets, which is what you usually want.
        const last = e.sets.at(-1);
        return { ...e, sets: [...e.sets, last ? { ...last, id: newId() } : blankSet()] };
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
    exercises: draft.exercises.map(({ id, exerciseId, restSeconds, notes, supersetId, sets }) => ({
      id,
      exerciseId,
      restSeconds,
      notes,
      supersetId,
      sets,
    })),
  };
}
