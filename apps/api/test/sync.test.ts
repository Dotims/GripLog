import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { appliedChanges, workouts } from "../src/db/schema";
import { nextCursor } from "../src/sync/pull";
import { change, setupTestApp, workout } from "./helpers";

const { app, db, signUp } = setupTestApp();

async function push(headers: Record<string, string>, changes: unknown[]) {
  const response = await app.request("/sync/push", {
    method: "POST",
    headers,
    body: JSON.stringify({ changes }),
  });
  return {
    status: response.status,
    body: (await response.json()) as { applied: string[]; skipped: string[] },
  };
}

async function pull(headers: Record<string, string>, cursor = 0, limit = 200) {
  const response = await app.request(`/sync/pull?cursor=${cursor}&limit=${limit}`, { headers });
  return (await response.json()) as {
    cursor: string;
    hasMore: boolean;
    workouts: { id: string; title: string; deletedAt: string | null; startedAt: string }[];
  };
}

describe("sync", () => {
  it("rejects requests without a session", async () => {
    const response = await app.request("/sync/pull");
    expect(response.status).toBe(401);
  });

  it("round-trips a workout through push and pull", async () => {
    const { headers } = await signUp("radek@example.com");
    const sent = workout();

    const { status, body } = await push(headers, [change(sent)]);
    expect(status).toBe(200);
    expect(body.applied).toHaveLength(1);

    const pulled = await pull(headers);
    expect(pulled.workouts).toHaveLength(1);
    expect(pulled.workouts[0]).toMatchObject({
      id: sent.id,
      title: "Push day",
      startedAt: sent.startedAt,
    });
  });

  it("keeps supersets and rep ranges of a routine", async () => {
    const { headers } = await signUp("routine@example.com");
    const routine = {
      id: randomUUID(),
      name: "Pull day",
      notes: null,
      position: 0,
      updatedAt: "2026-10-21T10:00:00.000Z",
      deletedAt: null,
      exercises: ["Pullups", "Plank"].map((exerciseId, position) => ({
        id: randomUUID(),
        exerciseId,
        position,
        restSeconds: 90,
        notes: null,
        supersetId: 0,
        sets: [
          {
            id: randomUUID(),
            position: 0,
            type: "normal",
            weightKg: null,
            reps: position === 0 ? 8 : null,
            repsMax: position === 0 ? 12 : null,
            durationSeconds: position === 1 ? 60 : null,
            distanceMeters: null,
          },
        ],
      })),
    };

    const { body } = await push(headers, [
      { changeId: randomUUID(), entity: "routine", data: routine },
    ]);
    expect(body.applied).toHaveLength(1);

    const response = await app.request("/sync/pull?cursor=0", { headers });
    const pulled = (await response.json()) as { routines: (typeof routine)[] };
    const [first, second] = pulled.routines[0]!.exercises;
    expect(first).toMatchObject({ supersetId: 0, sets: [{ reps: 8, repsMax: 12 }] });
    expect(second).toMatchObject({ supersetId: 0, sets: [{ durationSeconds: 60 }] });
  });

  it("treats a retried change id as already applied", async () => {
    const { headers } = await signUp("retry@example.com");
    const retried = change(workout());

    await push(headers, [retried]);
    const second = await push(headers, [retried]);

    expect(second.body).toEqual({ applied: [], skipped: [retried.changeId] });
    expect(await db.select().from(appliedChanges)).toHaveLength(1);
  });

  it("keeps the newer version when an older edit arrives late", async () => {
    const { headers } = await signUp("lww@example.com");
    const newer = workout({ title: "Edited on phone", updatedAt: "2026-10-15T10:00:00.000Z" });
    const older = { ...newer, title: "Stale tablet copy", updatedAt: "2026-10-15T09:00:00.000Z" };

    await push(headers, [change(newer)]);
    const { body } = await push(headers, [change(older)]);

    expect(body.applied).toEqual([]);
    const [row] = await db.select().from(workouts).where(eq(workouts.id, newer.id));
    expect(row?.title).toBe("Edited on phone");
  });

  it("never lets one user overwrite another user's workout", async () => {
    const owner = await signUp("owner@example.com");
    const attacker = await signUp("attacker@example.com");
    const original = workout();
    await push(owner.headers, [change(original)]);

    const hijack = { ...original, title: "Hijacked", updatedAt: "2030-01-01T00:00:00.000Z" };
    const { body } = await push(attacker.headers, [change(hijack)]);

    expect(body.applied).toEqual([]);
    const [row] = await db.select().from(workouts).where(eq(workouts.id, original.id));
    expect(row).toMatchObject({ title: "Push day", userId: owner.userId });
    expect((await pull(attacker.headers)).workouts).toEqual([]);
  });

  it("rolls the whole batch back when one change fails in the database", async () => {
    const { headers } = await signUp("atomic@example.com");
    const first = workout();
    // The second workout reuses the first one's set id, which breaks the primary key.
    const second = workout();
    second.exercises[0]!.sets[0]!.id = first.exercises[0]!.sets[0]!.id;

    const { status } = await push(headers, [change(first), change(second)]);

    expect(status).toBe(500);
    expect(await db.select().from(workouts)).toEqual([]);
    expect(await db.select().from(appliedChanges)).toEqual([]);
  });

  it("rejects malformed changes before touching the database", async () => {
    const { headers } = await signUp("invalid@example.com");
    const bad = workout();
    bad.exercises[0]!.sets[0]!.rpe = 42;

    const { status } = await push(headers, [change(bad)]);
    expect(status).toBe(400);
  });

  it("syncs deletions as tombstones", async () => {
    const { headers } = await signUp("delete@example.com");
    const kept = workout();
    await push(headers, [change(kept)]);
    const { cursor } = await pull(headers);

    await push(headers, [
      change({
        ...kept,
        deletedAt: "2026-10-16T08:00:00.000Z",
        updatedAt: "2026-10-16T08:00:00.000Z",
      }),
    ]);
    const delta = await pull(headers, Number(cursor));

    expect(delta.workouts).toHaveLength(1);
    expect(delta.workouts[0]?.deletedAt).toBe("2026-10-16T08:00:00.000Z");
  });

  it("pages through changes with a cursor", async () => {
    const { headers } = await signUp("paging@example.com");
    await push(headers, [change(workout()), change(workout()), change(workout())]);

    const first = await pull(headers, 0, 2);
    expect(first.workouts).toHaveLength(2);
    expect(first.hasMore).toBe(true);

    const second = await pull(headers, Number(first.cursor), 2);
    expect(second.workouts).toHaveLength(1);
    expect(second.hasMore).toBe(false);
    expect(new Set([...first.workouts, ...second.workouts].map((w) => w.id)).size).toBe(3);
  });
});

describe("nextCursor", () => {
  it("advances to the highest version when nothing was cut", () => {
    expect(
      nextCursor(
        [
          { versions: [3, 7], truncated: false },
          { versions: [5], truncated: false },
        ],
        1,
      ),
    ).toBe(7);
  });

  it("stops at the shortest cut list so no row is skipped", () => {
    expect(
      nextCursor(
        [
          { versions: [2, 4], truncated: true },
          { versions: [3, 9], truncated: false },
        ],
        1,
      ),
    ).toBe(4);
  });

  it("stays put when there is nothing new", () => {
    expect(nextCursor([{ versions: [], truncated: false }], 12)).toBe(12);
  });
});
