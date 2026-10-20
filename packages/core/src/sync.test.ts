import { describe, expect, it } from "vitest";

import { syncPushRequestSchema, type SyncWorkout } from "./sync";

const workout: SyncWorkout = {
  id: "0b6c4a0e-6f5e-4b8e-9a51-2f1f3c6d7e80",
  title: "Push day",
  notes: null,
  startedAt: "2026-10-14T16:05:00.000Z",
  endedAt: "2026-10-14T17:20:00.000Z",
  routineId: null,
  source: "app",
  updatedAt: "2026-10-14T17:20:00.000Z",
  deletedAt: null,
  exercises: [
    {
      id: "6f1c0d52-2b7e-4c55-8f0e-6a3b9d1e2f40",
      exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
      position: 0,
      notes: null,
      sets: [
        {
          id: "9d2e7c1a-4b3f-4e6d-8a5c-1b2c3d4e5f60",
          position: 0,
          type: "normal",
          weightKg: 80,
          reps: 8,
          rpe: 8,
          durationSeconds: null,
          distanceMeters: null,
        },
      ],
    },
  ],
};

const change = {
  changeId: "1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d",
  entity: "workout",
  data: workout,
};

describe("sync contract", () => {
  it("accepts a valid workout change", () => {
    expect(syncPushRequestSchema.safeParse({ changes: [change] }).success).toBe(true);
  });

  it("rejects an empty batch", () => {
    expect(syncPushRequestSchema.safeParse({ changes: [] }).success).toBe(false);
  });

  it("rejects impossible set values", () => {
    const bad = structuredClone(change);
    bad.data.exercises[0]!.sets[0]!.rpe = 11;
    expect(syncPushRequestSchema.safeParse({ changes: [bad] }).success).toBe(false);
  });

  it("rejects an unknown entity", () => {
    expect(
      syncPushRequestSchema.safeParse({ changes: [{ ...change, entity: "photo" }] }).success,
    ).toBe(false);
  });
});
