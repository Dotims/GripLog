import Storage from "expo-sqlite/kv-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { activeWorkoutSlice, type ActiveWorkoutState } from "./store";

/**
 * The running workout. Zustand rather than Context because it changes on every
 * keystroke and tick, and components subscribe to just the slice they show:
 * typing a weight re-renders that set row, not the whole screen.
 * Persisted to SQLite key-value storage, so killing the app mid-workout loses nothing.
 * Hydration waits for the app database (see RootStack): on the web both share one
 * SQLite worker, and opening two files at the same time makes it fail.
 */
export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(activeWorkoutSlice, {
    name: "griplog-active-workout",
    storage: createJSONStorage(() => Storage),
    partialize: (state) => ({ workout: state.workout, rest: state.rest }),
    skipHydration: true,
  }),
);
