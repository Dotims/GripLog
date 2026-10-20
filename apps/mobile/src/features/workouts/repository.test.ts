import { eq } from "drizzle-orm";

import { personalRecords, sets, syncOutbox, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { createTestDb } from "@/test/test-db";
import { insertExercise, workoutInput } from "@/test/factories";

import { deleteWorkout, EmptyWorkoutError, getWorkoutInput, saveWorkout } from "./repository";

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
  insertExercise(db, "bench");
  insertExercise(db, "squat");
});

const recordKinds = (workoutId: string) =>
  db
    .select({ kind: personalRecords.kind, value: personalRecords.value })
    .from(personalRecords)
    .where(eq(personalRecords.workoutId, workoutId))
    .all();

describe("saveWorkout", () => {
  it("stores the workout, its sets and queues it for sync", () => {
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      {
        exerciseId: "bench",
        sets: [
          [60, 10, "warmup"],
          [80, 8],
        ],
      },
    ]);
    saveWorkout(db, input);

    expect(getWorkoutInput(db, input.id)).toEqual(input);
    expect(db.select().from(syncOutbox).all()).toMatchObject([
      { entity: "workout", entityId: input.id },
    ]);
  });

  it("computes records from history, oldest workout first", () => {
    const first = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[80, 8]] },
    ]);
    const second = workoutInput("2026-10-08T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[85, 5]] },
    ]);
    saveWorkout(db, first);
    const records = saveWorkout(db, second);

    // 85x5 is heavier, but 80x8 has the bigger volume and 1RM estimate.
    expect(records.map((r) => r.kind)).toEqual(["weight"]);
    expect(
      recordKinds(first.id)
        .map((r) => r.kind)
        .sort(),
    ).toEqual(["one_rep_max", "set_volume", "weight"]);
  });

  it("moves records back to older workouts when a newer one is deleted", () => {
    const old = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[80, 5]] },
    ]);
    const newer = workoutInput("2026-10-08T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[90, 5]] },
    ]);
    saveWorkout(db, old);
    saveWorkout(db, newer);
    expect(recordKinds(old.id)).toHaveLength(3);

    deleteWorkout(db, newer.id);

    expect(recordKinds(newer.id)).toEqual([]);
    expect(recordKinds(old.id)).toHaveLength(3);
    expect(
      db.select().from(workouts).where(eq(workouts.id, newer.id)).get()?.deletedAt,
    ).not.toBeNull();
  });

  it("replaces sets when an existing workout is edited", () => {
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      {
        exerciseId: "bench",
        sets: [
          [80, 8],
          [80, 8],
        ],
      },
    ]);
    saveWorkout(db, input);
    saveWorkout(db, {
      ...input,
      exercises: [{ ...input.exercises[0]!, sets: input.exercises[0]!.sets.slice(0, 1) }],
    });

    expect(db.select().from(sets).all()).toHaveLength(1);
    expect(db.select().from(syncOutbox).all()).toHaveLength(1);
  });

  it("refuses to save a workout without sets", () => {
    expect(() => saveWorkout(db, workoutInput("2026-10-01T10:00:00.000Z", []))).toThrow(
      EmptyWorkoutError,
    );
  });

  it("rolls everything back when one row fails", () => {
    // The second exercise points at an exercise that does not exist, so its
    // insert breaks the foreign key after the workout row was already written.
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[80, 8]] },
      { exerciseId: "missing", sets: [[50, 10]] },
    ]);

    expect(() => saveWorkout(db, input)).toThrow();
    expect(db.select().from(workouts).all()).toEqual([]);
    expect(db.select().from(sets).all()).toEqual([]);
    expect(db.select().from(personalRecords).all()).toEqual([]);
    expect(db.select().from(syncOutbox).all()).toEqual([]);
  });
});
