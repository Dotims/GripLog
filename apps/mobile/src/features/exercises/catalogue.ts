import { IMAGE_BASE_URL } from "@griplog/catalogue";

export { catalogue, CATALOGUE_VERSION } from "@griplog/catalogue";

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
