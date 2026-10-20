import type { WeightUnit } from "@griplog/core";
import { createContext, use, type ReactNode } from "react";

import { useDatabase } from "@/db/DatabaseProvider";
import { profile } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";

import { profileQuery, updateProfile } from "./repository";

type Preferences = {
  unit: WeightUnit;
  defaultRestSeconds: number;
  setUnit: (unit: WeightUnit) => void;
  setDefaultRestSeconds: (seconds: number) => void;
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

  const value: Preferences = {
    unit: row?.unit ?? "kg",
    defaultRestSeconds: row?.defaultRestSeconds ?? 120,
    setUnit: (unit) => updateProfile(db, { unit }),
    setDefaultRestSeconds: (seconds) => updateProfile(db, { defaultRestSeconds: seconds }),
  };

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): Preferences {
  const preferences = use(PreferencesContext);
  if (!preferences) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return preferences;
}
