import type { SyncChange, SyncPullResponse, SyncWorkout } from "@griplog/core";
import { eq } from "drizzle-orm";

import { syncOutbox, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { saveWorkout } from "@/features/workouts/repository";
import { insertExercise, workoutInput } from "@/test/factories";
import { createTestDb } from "@/test/test-db";

import { readCursor } from "./apply";
import { pullRemote, pushPending, SyncHttpError, type SyncTransport } from "./engine";
import { blockedChanges, pendingChanges } from "./outbox";

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
  insertExercise(db, "bench");
});

const emptyPage: SyncPullResponse = {
  cursor: "0",
  hasMore: false,
  workouts: [],
  routines: [],
  exercises: [],
  profile: null,
};

function transport(overrides: Partial<SyncTransport> = {}): SyncTransport & { sent: SyncChange[] } {
  const sent: SyncChange[] = [];
  return {
    sent,
    push: async (changes) => {
      sent.push(...changes);
      return { applied: changes.map((c) => c.changeId), skipped: [] };
    },
    pull: async () => emptyPage,
    ...overrides,
  };
}

function remoteWorkout(id: string, title: string): SyncWorkout {
  return {
    id,
    title,
    notes: null,
    startedAt: "2026-10-10T10:00:00.000Z",
    endedAt: "2026-10-10T11:00:00.000Z",
    routineId: null,
    source: "app",
    updatedAt: "2026-10-10T11:00:00.000Z",
    deletedAt: null,
    exercises: [
      {
        id: "8b0f3c62-1f7e-4a7e-9a41-0a6d2c1e9b10",
        exerciseId: "bench",
        position: 0,
        notes: null,
        sets: [
          {
            id: "5d6c2a1b-0e9f-4c8d-b7a6-1f2e3d4c5b60",
            position: 0,
            type: "normal",
            weightKg: 100,
            reps: 5,
            rpe: null,
            durationSeconds: null,
            distanceMeters: null,
          },
        ],
      },
    ],
  };
}

describe("pushPending", () => {
  it("uploads queued workouts and empties the outbox", async () => {
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[80, 8]] },
    ]);
    saveWorkout(db, input);
    const fake = transport();

    expect(await pushPending(db, fake)).toBe(1);
    expect(fake.sent[0]).toMatchObject({ entity: "workout", data: { id: input.id } });
    expect(db.select().from(syncOutbox).all()).toEqual([]);
  });

  it("keeps an edit made while the upload was in flight", async () => {
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[80, 8]] },
    ]);
    saveWorkout(db, input);
    const titles: string[] = [];
    let edited = false;
    const fake = transport({
      push: async (changes) => {
        titles.push(...changes.map((c) => (c.entity === "workout" ? c.data.title : "")));
        if (!edited) {
          // The user renames the workout before the server answers.
          edited = true;
          saveWorkout(db, { ...input, title: "Renamed" });
        }
        return { applied: changes.map((c) => c.changeId), skipped: [] };
      },
    });

    // The first round acknowledges only the old change id, so the rename goes out in a second round.
    await pushPending(db, fake);
    expect(titles).toEqual(["Workout", "Renamed"]);
    expect(db.select().from(syncOutbox).all()).toEqual([]);
  });

  it("keeps the queue and records the error when the network fails", async () => {
    saveWorkout(
      db,
      workoutInput("2026-10-01T10:00:00.000Z", [{ exerciseId: "bench", sets: [[80, 8]] }]),
    );
    const offline = transport({
      push: async () => {
        throw new Error("Network request failed");
      },
    });

    await expect(pushPending(db, offline)).rejects.toThrow("Network request failed");
    expect(db.select().from(syncOutbox).all()).toMatchObject([
      { attempts: 1, lastError: "Network request failed" },
    ]);
  });

  it("parks a change that breaks the contract and sends the rest", async () => {
    saveWorkout(
      db,
      workoutInput("2026-10-01T10:00:00.000Z", [{ exerciseId: "bench", sets: [[2505, 1]] }]),
    );
    saveWorkout(
      db,
      workoutInput("2026-10-02T10:00:00.000Z", [{ exerciseId: "bench", sets: [[80, 8]] }]),
    );
    const fake = transport();

    expect(await pushPending(db, fake)).toBe(1);
    expect(blockedChanges(db)).toMatchObject([
      { blockedReason: expect.stringContaining("weightKg") },
    ]);
    expect(pendingChanges(db, 10)).toEqual([]);
  });

  it("finds the one change the server rejects inside a batch", async () => {
    const bad = workoutInput(
      "2026-10-01T10:00:00.000Z",
      [{ exerciseId: "bench", sets: [[80, 8]] }],
      { title: "Rejected" },
    );
    saveWorkout(db, bad);
    saveWorkout(
      db,
      workoutInput("2026-10-02T10:00:00.000Z", [{ exerciseId: "bench", sets: [[80, 8]] }]),
    );
    const fake = transport({
      push: async (changes) => {
        if (changes.some((c) => c.entity === "workout" && c.data.title === "Rejected")) {
          throw new SyncHttpError(400, "bad request");
        }
        return { applied: changes.map((c) => c.changeId), skipped: [] };
      },
    });

    expect(await pushPending(db, fake)).toBe(1);
    expect(blockedChanges(db)).toHaveLength(1);
  });

  it("unblocks a parked change once the workout is edited", async () => {
    const input = workoutInput("2026-10-01T10:00:00.000Z", [
      { exerciseId: "bench", sets: [[2505, 1]] },
    ]);
    saveWorkout(db, input);
    await pushPending(db, transport());
    saveWorkout(db, {
      ...input,
      exercises: [
        { ...input.exercises[0]!, sets: [{ ...input.exercises[0]!.sets[0]!, weightKg: 25 }] },
      ],
    });

    expect(blockedChanges(db)).toEqual([]);
    expect(await pushPending(db, transport())).toBe(1);
  });
});

describe("pullRemote", () => {
  it("applies remote workouts, computes records and stores the cursor", async () => {
    const id = "3f2a1b0c-9d8e-4f7a-8b6c-5d4e3f2a1b0c";
    const fake = transport({
      pull: async () => ({
        ...emptyPage,
        cursor: "42",
        workouts: [remoteWorkout(id, "From the tablet")],
      }),
    });

    expect(await pullRemote(db, fake)).toBe(1);
    expect(db.select().from(workouts).where(eq(workouts.id, id)).get()?.title).toBe(
      "From the tablet",
    );
    expect(readCursor(db)).toBe(42);
  });

  it("does not overwrite a local edit that is still waiting to upload", async () => {
    const id = "3f2a1b0c-9d8e-4f7a-8b6c-5d4e3f2a1b0c";
    saveWorkout(db, {
      ...workoutInput("2026-10-10T10:00:00.000Z", [{ exerciseId: "bench", sets: [[80, 8]] }]),
      id,
      title: "Local",
    });
    const fake = transport({
      pull: async () => ({ ...emptyPage, cursor: "7", workouts: [remoteWorkout(id, "Remote")] }),
    });

    await pullRemote(db, fake);
    expect(db.select().from(workouts).where(eq(workouts.id, id)).get()?.title).toBe("Local");
  });

  it("creates a placeholder for exercises this device does not know", async () => {
    const workout = remoteWorkout("3f2a1b0c-9d8e-4f7a-8b6c-5d4e3f2a1b0c", "Remote");
    workout.exercises[0]!.exerciseId = "some-other-catalogue-id";
    await pullRemote(
      db,
      transport({ pull: async () => ({ ...emptyPage, cursor: "1", workouts: [workout] }) }),
    );
    expect(db.select().from(workouts).all()).toHaveLength(1);
  });
});
