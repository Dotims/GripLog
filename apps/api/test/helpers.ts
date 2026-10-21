import type { SyncChange, SyncWorkout } from "@griplog/core";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach } from "vitest";

import { createApp } from "../src/app";
import { createAuth } from "../src/auth";
import { createDatabase } from "../src/db/client";
import { loadEnv } from "../src/env";

export function setupTestApp() {
  const env = loadEnv();
  const { db, close } = createDatabase(env.DATABASE_URL);
  const app = createApp({ db, auth: createAuth(db, env), env });

  beforeEach(async () => {
    await db.execute(sql`truncate table "user", applied_changes restart identity cascade`);
  });
  afterAll(close);

  /** Registers a user through the real auth endpoint and returns headers carrying the session. */
  async function signUp(email: string, name = "Test User") {
    const response = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse-battery", name }),
    });
    if (!response.ok)
      throw new Error(`Sign up failed: ${response.status} ${await response.text()}`);
    const cookie = response.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) throw new Error("No session cookie");
    const { user } = (await response.json()) as { user: { id: string } };
    return { userId: user.id, headers: { Cookie: cookie, "Content-Type": "application/json" } };
  }

  return { app, db, signUp };
}

export function workout(overrides: Partial<SyncWorkout> = {}): SyncWorkout {
  const exerciseId = randomUUID();
  return {
    id: randomUUID(),
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
        id: exerciseId,
        exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
        position: 0,
        notes: null,
        supersetId: null,
        sets: [
          {
            id: randomUUID(),
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
    ...overrides,
  };
}

export function change(data: SyncWorkout, changeId = randomUUID()): SyncChange {
  return { changeId, entity: "workout", data };
}
