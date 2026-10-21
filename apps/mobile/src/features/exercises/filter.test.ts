import { filterExercises, libraryExercises, sortByUsage } from "./filter";
import type { ExerciseListItem } from "./repository";

const exercise = (id: string, name: string, muscle: string): ExerciseListItem => ({
  id,
  name,
  trackingType: "weight_reps",
  equipment: null,
  primaryMuscles: [muscle],
  isCustom: false,
});

const list = [
  exercise("a", "Dumbbell Bicep Curl", "biceps"),
  exercise("b", "Barbell Bench Press", "chest"),
  exercise("c", "Barbell Curl", "biceps"),
];

describe("filterExercises", () => {
  it("matches every word in any order, ignoring case", () => {
    expect(filterExercises(list, "curl DUMB", null).map((e) => e.id)).toEqual(["a"]);
  });

  it("filters by primary muscle", () => {
    expect(filterExercises(list, "", "biceps").map((e) => e.id)).toEqual(["a", "c"]);
  });
});

describe("sortByUsage", () => {
  it("puts the most used exercises first and keeps the rest alphabetical", () => {
    const sorted = sortByUsage(list, new Map([["c", 5]]));
    expect(sorted.map((e) => e.id)).toEqual(["c", "b", "a"]);
  });
});

describe("libraryExercises", () => {
  it("keeps animated, custom, logged and common exercises and hides the rest", () => {
    const all = [
      exercise("animated", "Barbell Curl", "biceps"),
      { ...exercise("custom", "My Curl", "biceps"), isCustom: true },
      exercise("logged", "Odd Curl", "biceps"),
      exercise("common", "Face Pull", "shoulders"),
      exercise("hidden", "Obscure Stretch", "neck"),
    ];
    const kept = libraryExercises(
      all,
      new Map([["logged", 2]]),
      (id) => id === "animated",
      new Set(["common"]),
    );
    expect(kept.map((e) => e.id)).toEqual(["animated", "custom", "logged", "common"]);
  });
});
