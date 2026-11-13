import { readFileSync } from "node:fs";
import path from "node:path";

import { catalogue } from "@griplog/catalogue";
import { parseHevyCsv } from "@griplog/core";
import { eq } from "drizzle-orm";

import { exercises, personalRecords, sets, syncOutbox, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { seedCatalogue } from "@/features/exercises/repository";
import { writeWorkoutRows } from "@/features/workouts/repository";
import { createTestDb } from "@/test/test-db";

import { HEVY_EXERCISE_MAP } from "./hevy-exercise-map";
import { planHevyImport, runHevyImport } from "./hevy-import";

const csv = readFileSync(
  path.join(__dirname, "../../../../../packages/core/src/__fixtures__/hevy-export.csv"),
  "utf8",
);

const NAMESPACE = "3f1f8a2e-5b7c-4d0e-9a6b-2c8d4e1f7a90";
const OTHER_NAMESPACE = "9b2c6d4e-1a3f-4e5d-8c7b-6a5f4e3d2c1b";

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

  it("gives a workout the same id on every phone of one account", async () => {
    const other = await createTestDb();
    seedCatalogue(other, catalogue, "test");
    const custom = csv.replaceAll("Push Up", "Archer Push Up");
    for (const device of [db, other])
      runHevyImport(device, planHevyImport(device, parseHevyCsv(custom), NAMESPACE));

    const ids = (device: Db) =>
      [
        ...device.select({ id: workouts.id }).from(workouts).all(),
        ...device
          .select({ id: exercises.id })
          .from(exercises)
          .where(eq(exercises.isCustom, true))
          .all(),
      ]
        .map((row) => row.id)
        .sort();
    expect(ids(other)).toEqual(ids(db));
  });

  it("gives other accounts, and signed-out imports, different workout ids", () => {
    const parsed = parseHevyCsv(csv);
    const ids = (namespace: string | null) =>
      planHevyImport(db, parsed, namespace).workouts.map((w) => w.id);

    expect(ids(OTHER_NAMESPACE)).not.toEqual(ids(NAMESPACE));
    expect(ids(null)).not.toEqual(ids(null));
  });

  it("skips workouts renamed since the last import", () => {
    runHevyImport(db, planHevyImport(db, parseHevyCsv(csv), NAMESPACE));
    db.update(workouts).set({ title: "Renamed" }).run();
    expect(planHevyImport(db, parseHevyCsv(csv), NAMESPACE)).toMatchObject({
      duplicates: 2,
      workouts: [],
    });
  });

  it("reuses a custom exercise renamed since the last import", () => {
    const custom = csv.replaceAll("Push Up", "Archer Push Up");
    runHevyImport(db, planHevyImport(db, parseHevyCsv(custom)));
    db.update(exercises).set({ name: "Archer push-up" }).where(eq(exercises.isCustom, true)).run();

    const shifted = custom.replaceAll("2024", "2025");
    runHevyImport(db, planHevyImport(db, parseHevyCsv(shifted)));
    expect(db.select().from(exercises).where(eq(exercises.isCustom, true)).all()).toHaveLength(1);
  });

  it("leaves a workout alone that a sync brought in after the review", () => {
    const plan = planHevyImport(db, parseHevyCsv(csv), NAMESPACE);
    const first = plan.workouts[0]!;
    writeWorkoutRows(
      db,
      {
        ...first,
        title: "Renamed on the other phone",
        notes: null,
        routineId: null,
        source: "hevy",
        exercises: [],
      },
      "2030-01-01T00:00:00.000Z",
    );

    expect(runHevyImport(db, plan)).toMatchObject({ workouts: 1 });
    const kept = db.select().from(workouts).where(eq(workouts.id, first.id)).get();
    expect(kept?.title).toBe("Renamed on the other phone");
  });

  it("still imports when a sync brought in its custom exercise after the review", async () => {
    const custom = parseHevyCsv(csv.replaceAll("Push Up", "Archer Push Up"));
    const plan = planHevyImport(db, custom, NAMESPACE);
    const other = await createTestDb();
    seedCatalogue(other, catalogue, "test");
    runHevyImport(other, planHevyImport(other, custom, NAMESPACE));
    db.insert(exercises)
      .values(other.select().from(exercises).where(eq(exercises.isCustom, true)).get()!)
      .run();

    expect(runHevyImport(db, plan)).toMatchObject({ workouts: 2, createdExercises: 0 });
  });
});
