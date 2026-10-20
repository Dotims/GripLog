import type { TrackingType } from "@griplog/core";

import data from "../data/exercises.json";

export type CatalogueExercise = {
  id: string;
  name: string;
  trackingType: TrackingType;
  category: string | null;
  equipment: string | null;
  level: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

/** Bump when data/exercises.json is regenerated, so existing installs reseed. */
export const CATALOGUE_VERSION = "free-exercise-db@2026-10-21";

export const catalogue = data as unknown as readonly CatalogueExercise[];

export const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const names = new Map(catalogue.map((exercise) => [exercise.id, exercise.name]));

/** Display name for a catalogue id, or undefined for custom exercises. */
export function catalogueName(id: string): string | undefined {
  return names.get(id);
}
