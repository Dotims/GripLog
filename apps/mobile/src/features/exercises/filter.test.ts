import { filterExercises, sortByUsage } from "./filter";
import type { ExerciseListItem } from "./repository";

const exercise = (id: string, name: string, muscle: string): ExerciseListItem => ({
  id,
  name,
  trackingType: "weight_reps",
  equipment: null,
  primaryMuscles: [muscle],
  images: [],
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
