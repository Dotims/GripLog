import Storage from "expo-sqlite/kv-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { activeWorkoutSlice, type ActiveWorkoutState } from "./store";

/** Hydrates after the app database opens: on the web both share one SQLite worker. */
export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(activeWorkoutSlice, {
    name: "griplog-active-workout",
    storage: createJSONStorage(() => Storage),
    partialize: (state) => ({ workout: state.workout, rest: state.rest }),
    skipHydration: true,
  }),
);
