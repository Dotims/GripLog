import type { WeightUnit } from "@griplog/core";
import { createContext, use, useEffect, type ReactNode } from "react";

import { useDatabase } from "@/db/DatabaseProvider";
import { profile } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";
import { setSoundsEnabled } from "@/lib/sounds";

import { profileQuery, updateProfile } from "./repository";

export type LiftGoal = { exerciseId: string; weightKg: number };

type Preferences = {
  unit: WeightUnit;
  defaultRestSeconds: number;
  /** Workouts a week that keep the streak going. */
  weeklyGoal: number;
  liftGoal: LiftGoal | null;
  soundsEnabled: boolean;
  setUnit: (unit: WeightUnit) => void;
  setDefaultRestSeconds: (seconds: number) => void;
  setWeeklyGoal: (workouts: number) => void;
  setLiftGoal: (goal: LiftGoal | null) => void;
  setSoundsEnabled: (enabled: boolean) => void;
};

/**
 * Settings read all over the app but changed maybe once a month. That is the
 * case Context is good at: when the value changes every consumer re-renders,
 * which is fine at this frequency. Fast-changing state (the running workout)
 * lives in Zustand instead, where components subscribe to slices.
 */
const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const row = useLiveQuery(() => profileQuery(db).get(), [profile]);

  const soundsEnabled = row?.soundsEnabled ?? true;
  useEffect(() => setSoundsEnabled(soundsEnabled), [soundsEnabled]);

  const value: Preferences = {
    unit: row?.unit ?? "kg",
    defaultRestSeconds: row?.defaultRestSeconds ?? 120,
    weeklyGoal: row?.weeklyGoal ?? 3,
    liftGoal:
      row?.goalExerciseId && row.goalWeightKg
        ? { exerciseId: row.goalExerciseId, weightKg: row.goalWeightKg }
        : null,
    soundsEnabled,
    setUnit: (unit) => updateProfile(db, { unit }),
    setDefaultRestSeconds: (seconds) => updateProfile(db, { defaultRestSeconds: seconds }),
    setWeeklyGoal: (workouts) =>
      updateProfile(db, { weeklyGoal: Math.min(7, Math.max(1, workouts)) }),
    setLiftGoal: (goal) =>
      updateProfile(db, {
        goalExerciseId: goal?.exerciseId ?? null,
        goalWeightKg: goal?.weightKg ?? null,
      }),
    setSoundsEnabled: (enabled) => updateProfile(db, { soundsEnabled: enabled }),
  };

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): Preferences {
  const preferences = use(PreferencesContext);
  if (!preferences) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return preferences;
}
