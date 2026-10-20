import data from "../../../assets/data/exercises.json";

import type { CatalogueExercise } from "./repository";

/** Bump when assets/data/exercises.json is regenerated, so existing installs reseed. */
export const CATALOGUE_VERSION = "free-exercise-db@2026-10-21";

export const catalogue = data as unknown as readonly CatalogueExercise[];

export const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export function exerciseImageUrl(path: string): string {
  return path.startsWith("http") || path.startsWith("file:") ? path : `${IMAGE_BASE_URL}${path}`;
}

export const MUSCLE_GROUPS = [
  "chest",
  "lats",
  "middle back",
  "lower back",
  "shoulders",
  "traps",
  "biceps",
  "triceps",
  "forearms",
  "abdominals",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "adductors",
  "abductors",
  "neck",
] as const;

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "body only",
  "kettlebells",
  "bands",
  "e-z curl bar",
  "other",
] as const;
