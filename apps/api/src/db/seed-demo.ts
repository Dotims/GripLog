/**
 * Seeds a few demo athletes with recent workouts, so the social feed has
 * something to show on a fresh local server. Goes through the real auth and
 * sync endpoints and uses stable ids, so running it again only refreshes dates.
 *
 *   npm run db:seed-demo -w @griplog/api [-- --follower you@example.com]
 */
import { catalogueName } from "@griplog/catalogue";
import type { SetType, SyncChange, SyncWorkout } from "@griplog/core";
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";

import { createApp } from "../app";
import { createAuth } from "../auth";
import { loadEnv } from "../env";
import { createDatabase } from "./client";
import { runMigrations } from "./migrate";
import { follows, user } from "./schema";

const PASSWORD = "griplog-demo-2026";

/** [exercise id, sets as "weight x reps"], a weight of 0 is bodyweight. */
type Lift = [string, string[]];
type Session = { title: string; daysAgo: number; hour: number; minutes: number; lifts: Lift[] };
type Athlete = { name: string; email: string; sessions: Session[] };

const ATHLETES: Athlete[] = [
  {
    name: "Ola Kowalska",
    email: "ola@griplog.dev",
    sessions: [
      {
        title: "Lower A",
        daysAgo: 0,
        hour: 7,
        minutes: 68,
        lifts: [
          ["Barbell_Squat", ["60x8", "80x5", "80x5", "80x5"]],
          ["Romanian_Deadlift", ["70x8", "70x8", "70x8"]],
          ["Leg_Press", ["140x10", "140x10", "160x8"]],
          ["Lying_Leg_Curls", ["35x12", "35x12"]],
        ],
      },
      {
        title: "Upper A",
        daysAgo: 2,
        hour: 18,
        minutes: 61,
        lifts: [
          ["Dumbbell_Bench_Press", ["20x10", "22.5x8", "22.5x8"]],
          ["Wide-Grip_Lat_Pulldown", ["45x10", "50x8", "50x8"]],
          ["Side_Lateral_Raise", ["8x15", "8x15", "8x12"]],
        ],
      },
    ],
  },
  {
    name: "Kuba Nowak",
    email: "kuba@griplog.dev",
    sessions: [
      {
        title: "Push",
        daysAgo: 1,
        hour: 19,
        minutes: 74,
        lifts: [
          ["Barbell_Bench_Press_-_Medium_Grip", ["60x10", "100x5", "102.5x5", "102.5x4"]],
          ["Incline_Dumbbell_Press", ["34x10", "34x9", "34x8"]],
          ["Standing_Military_Press", ["50x8", "50x8", "50x7"]],
          ["Triceps_Pushdown", ["30x12", "30x12", "30x10"]],
        ],
      },
      {
        title: "Pull",
        daysAgo: 3,
        hour: 18,
        minutes: 66,
        lifts: [
          ["Barbell_Deadlift", ["100x5", "160x3", "180x2"]],
          ["Pullups", ["0x10", "0x8", "0x8"]],
          ["Seated_Cable_Rows", ["65x10", "70x10", "70x9"]],
          ["Hammer_Curls", ["16x12", "16x10"]],
        ],
      },
    ],
  },
  {
    name: "Marta Zielińska",
    email: "marta@griplog.dev",
    sessions: [
      {
        title: "Full body",
        daysAgo: 1,
        hour: 6,
        minutes: 52,
        lifts: [
          ["Barbell_Squat", ["50x8", "55x8", "55x8"]],
          ["Bent_Over_Barbell_Row", ["40x10", "40x10", "40x10"]],
          ["Dumbbell_Bench_Press", ["16x10", "16x10", "16x9"]],
          ["Barbell_Curl", ["20x12", "20x10"]],
        ],
      },
    ],
  },
];

/** A UUID derived from a name, so every run writes the same rows. */
function stableId(...parts: (string | number)[]): string {
  const hex = createHash("sha256").update(parts.join("/")).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function toWorkout(athlete: Athlete, session: Session, index: number, now: Date): SyncWorkout {
  const start = new Date(now);
  start.setDate(start.getDate() - session.daysAgo);
  start.setHours(session.hour, 10, 0, 0);
  // A session later today than now has not happened yet, so it moves a day back.
  if (start > now) start.setDate(start.getDate() - 1);
  const end = new Date(start.getTime() + session.minutes * 60_000);
  const key = [athlete.email, index] as const;

  return {
    id: stableId(...key),
    title: session.title,
    notes: null,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    routineId: null,
    source: "app",
    updatedAt: now.toISOString(),
    deletedAt: null,
    exercises: session.lifts.map(([exerciseId, sets], position) => {
      if (!catalogueName(exerciseId)) throw new Error(`Unknown exercise ${exerciseId}`);
      return {
        id: stableId(...key, position),
        exerciseId,
        position,
        notes: null,
        supersetId: null,
        sets: sets.map((set, setPosition) => {
          const [weight, reps] = set.split("x").map(Number);
          const type: SetType = setPosition === 0 && sets.length > 3 ? "warmup" : "normal";
          return {
            id: stableId(...key, position, setPosition),
            position: setPosition,
            type,
            weightKg: weight || null,
            reps: reps ?? null,
            repsMax: null,
            rpe: null,
            durationSeconds: null,
            distanceMeters: null,
          };
        }),
      };
    }),
  };
}

const env = loadEnv();
await runMigrations(env.DATABASE_URL);
const { db, close } = createDatabase(env.DATABASE_URL);
const app = createApp({ db, auth: createAuth(db, env), env });

async function session(athlete: Athlete): Promise<string> {
  const json = { "Content-Type": "application/json" };
  const signUp = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ email: athlete.email, password: PASSWORD, name: athlete.name }),
  });
  const response = signUp.ok
    ? signUp
    : await app.request("/api/auth/sign-in/email", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ email: athlete.email, password: PASSWORD }),
      });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!response.ok || !cookie)
    throw new Error(`Could not sign in ${athlete.email}: ${response.status}`);
  return cookie;
}

const now = new Date();
const followerFlag = process.argv.indexOf("--follower");
const followerEmail = followerFlag > 0 ? process.argv[followerFlag + 1] : undefined;
const [follower] = followerEmail
  ? await db.select().from(user).where(eq(user.email, followerEmail))
  : [];
if (followerEmail && !follower) throw new Error(`No account for ${followerEmail}`);

try {
  for (const athlete of ATHLETES) {
    const cookie = await session(athlete);
    const changes: SyncChange[] = athlete.sessions.map((s, i) => ({
      changeId: stableId(athlete.email, i, now.toISOString()),
      entity: "workout",
      data: toWorkout(athlete, s, i, now),
    }));
    const pushed = await app.request("/sync/push", {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    if (!pushed.ok) throw new Error(`Sync failed for ${athlete.email}: ${await pushed.text()}`);

    if (follower) {
      const [row] = await db.select().from(user).where(eq(user.email, athlete.email));
      const exists = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, follower.id), eq(follows.followeeId, row!.id)));
      if (exists.length === 0)
        await db.insert(follows).values({ followerId: follower.id, followeeId: row!.id });
    }
    console.log(`${athlete.name}: ${athlete.sessions.length} workouts`);
  }
  console.log(`Demo accounts share the password ${PASSWORD}`);
} finally {
  await close();
}
