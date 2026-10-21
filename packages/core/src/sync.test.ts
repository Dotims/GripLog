import { describe, expect, it } from "vitest";

import { syncPushRequestSchema, type SyncRoutine, type SyncWorkout } from "./sync";

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
      supersetId: null,
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

  it("accepts changes from older apps that send no superset or rep range", () => {
    const old = structuredClone(change) as { data: { exercises: Record<string, unknown>[] } };
    delete old.data.exercises[0]!.supersetId;
    const parsed = syncPushRequestSchema.parse({ changes: [old] });
    const data = parsed.changes[0]!.data as SyncWorkout;
    expect(data.exercises[0]!.supersetId).toBeNull();

    const routine = syncPushRequestSchema.parse({
      changes: [
        {
          changeId: "2b3c4d5e-6f7a-4b2c-9d3e-4f5a6b7c8d9e",
          entity: "routine",
          data: {
            id: "3c4d5e6f-7a8b-4c3d-8e4f-5a6b7c8d9e0f",
            name: "Pull day",
            notes: null,
            position: 0,
            updatedAt: "2026-10-14T17:20:00.000Z",
            deletedAt: null,
            exercises: [
              {
                id: "4d5e6f7a-8b9c-4d4e-9f5a-6b7c8d9e0f1a",
                exerciseId: "Pullups",
                position: 0,
                restSeconds: 120,
                notes: null,
                sets: [
                  {
                    id: "5e6f7a8b-9c0d-4e5f-8a6b-7c8d9e0f1a2b",
                    position: 0,
                    type: "normal",
                    weightKg: null,
                    reps: 8,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    const set = (routine.changes[0]!.data as SyncRoutine).exercises[0]!.sets[0]!;
    expect(set).toMatchObject({ reps: 8, repsMax: null, durationSeconds: null });
  });

  it("rejects an unknown entity", () => {
    expect(
      syncPushRequestSchema.safeParse({ changes: [{ ...change, entity: "photo" }] }).success,
    ).toBe(false);
  });
});
