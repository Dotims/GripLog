import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HevyImportError, inferTrackingType, parseHevyCsv, parseHevyDate } from "./hevy";

const fixture = readFileSync(join(import.meta.dirname, "__fixtures__/hevy-export.csv"), "utf8");

describe("parseHevyDate", () => {
  it("reads Hevy's local timestamp", () => {
    expect(parseHevyDate("14 Oct 2026, 18:05")).toBe(new Date(2026, 9, 14, 18, 5).toISOString());
  });

  it("rejects anything else", () => {
    expect(() => parseHevyDate("2026-10-14 18:05")).toThrow(HevyImportError);
  });
});

describe("parseHevyCsv", () => {
  const workouts = parseHevyCsv(fixture);

  it("groups rows into workouts sorted oldest first", () => {
    expect(workouts.map((w) => w.title)).toEqual(["Legs", "Push day"]);
    expect(workouts[1]?.description).toBe('Felt strong, "easy" day');
  });

  it("keeps exercise order, notes and set details", () => {
    const [bench] = workouts[1]!.exercises;
    expect(bench).toMatchObject({ title: "Bench Press (Barbell)", notes: "Pause on chest" });
    expect(bench!.sets.map((s) => s.type)).toEqual(["warmup", "normal", "dropset"]);
    expect(bench!.sets[1]).toEqual({
      type: "normal",
      weightKg: 80,
      reps: 8,
      rpe: 8,
      durationSeconds: null,
      distanceMeters: null,
    });
  });

  it("starts a new block when the same exercise repeats its set index", () => {
    const titles = workouts[1]!.exercises.map((e) => e.title);
    expect(titles).toEqual(["Bench Press (Barbell)", "Plank", "Plank", "Running"]);
  });

  it("converts distance to metres", () => {
    expect(workouts[1]!.exercises[3]!.sets[0]!.distanceMeters).toBe(2500);
  });

  it("rejects files that are not a Hevy export", () => {
    expect(() => parseHevyCsv("name,reps\nSquat,5")).toThrow(/missing columns/);
  });

  it("returns nothing for an empty file", () => {
    expect(parseHevyCsv("")).toEqual([]);
  });
});

describe("inferTrackingType", () => {
  const exercises = parseHevyCsv(fixture).flatMap((w) => w.exercises);
  const typeOf = (title: string) =>
    inferTrackingType(exercises.find((e) => e.title === title)!.sets);

  it("recognises each way of measuring", () => {
    expect(typeOf("Bench Press (Barbell)")).toBe("weight_reps");
    expect(typeOf("Plank")).toBe("duration");
    expect(typeOf("Running")).toBe("distance_duration");
    expect(typeOf("Push Up")).toBe("reps");
  });
});
