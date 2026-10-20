import { readFileSync } from "node:fs";
import path from "node:path";

import { parseHevyCsv } from "@griplog/core";

import { exercises, personalRecords, sets, syncOutbox, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { seedCatalogue, type CatalogueExercise } from "@/features/exercises/repository";
import { createTestDb } from "@/test/test-db";

import { HEVY_EXERCISE_MAP } from "./hevy-exercise-map";
import { planHevyImport, runHevyImport } from "./hevy-import";

const catalogue: CatalogueExercise[] = require("../../../assets/data/exercises.json");
const csv = readFileSync(
  path.join(__dirname, "../../../../../packages/core/src/__fixtures__/hevy-export.csv"),
  "utf8",
);

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
  seedCatalogue(db, catalogue, "test");
});

describe("Hevy exercise map", () => {
  it("only points at exercises that exist in the catalogue", () => {
    const ids = new Set(catalogue.map((e) => e.id));
    const broken = Object.entries(HEVY_EXERCISE_MAP).filter(([, id]) => !ids.has(id));
    expect(broken).toEqual([]);
  });
});

describe("Hevy import", () => {
  it("plans matches and creates custom exercises for unknown titles", () => {
    const plan = planHevyImport(db, parseHevyCsv(csv));
    expect(plan.workouts).toHaveLength(2);
    expect(plan.setCount).toBe(7);
    expect(plan.matches).toEqual(
      expect.arrayContaining([
        {
          title: "Bench Press (Barbell)",
          exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
          trackingType: "weight_reps",
        },
        { title: "Plank", exerciseId: "Plank", trackingType: "duration" },
      ]),
    );
  });

  it("writes workouts, sets, records and outbox entries in one go", () => {
    const result = runHevyImport(db, planHevyImport(db, parseHevyCsv(csv)));

    expect(result).toEqual({ workouts: 2, sets: 7, createdExercises: 0 });
    expect(db.select().from(workouts).all()).toHaveLength(2);
    expect(db.select().from(sets).all()).toHaveLength(7);
    expect(db.select().from(personalRecords).all().length).toBeGreaterThan(0);
    expect(db.select().from(syncOutbox).all()).toHaveLength(2);
  });

  it("drops sets with impossible values instead of importing typos", () => {
    const typo = csv.replace('"normal",80,8,,,8', '"normal",2505,1,,,');
    const plan = planHevyImport(db, parseHevyCsv(typo));
    expect(plan).toMatchObject({ skippedSets: 1, setCount: 6 });
  });

  it("skips workouts that were imported before", () => {
    runHevyImport(db, planHevyImport(db, parseHevyCsv(csv)));
    const again = planHevyImport(db, parseHevyCsv(csv));
    expect(again).toMatchObject({ duplicates: 2, workouts: [], setCount: 0 });
  });

  it("creates a custom exercise once and reuses it on the next import", () => {
    const custom = csv.replaceAll("Push Up", "Archer Push Up");
    runHevyImport(db, planHevyImport(db, parseHevyCsv(custom)));
    const created = db
      .select()
      .from(exercises)
      .all()
      .filter((e) => e.isCustom);
    expect(created).toMatchObject([{ name: "Archer Push Up", trackingType: "reps" }]);

    const shifted = custom.replaceAll("2024", "2025");
    const plan = planHevyImport(db, parseHevyCsv(shifted));
    expect(plan.matches.find((m) => m.title === "Archer Push Up")?.exerciseId).toBe(created[0]!.id);
  });
});
