import { SET_TYPES, TRACKING_TYPES } from "@griplog/core";
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables (names and columns follow its Drizzle adapter)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Training data
// ---------------------------------------------------------------------------

export const setType = pgEnum("set_type", SET_TYPES);
export const trackingType = pgEnum("tracking_type", TRACKING_TYPES);
export const workoutSource = pgEnum("workout_source", ["app", "hevy"]);

/**
 * One global, ever-increasing counter. Every synced write stamps its row with
 * the next value, and a device pulls "everything with a version above the last
 * one I saw". Writes for one user are serialised (see sync/push.ts), so for a
 * single user versions are handed out in commit order and nothing is skipped.
 */
export const syncVersion = pgSequence("sync_version_seq");

const version = () =>
  bigint("version", { mode: "number" })
    .notNull()
    .default(sql`nextval('sync_version_seq')`);

const owner = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey(),
    userId: owner(),
    title: text("title").notNull(),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    routineId: uuid("routine_id"),
    source: workoutSource("source").notNull().default("app"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: version(),
  },
  (t) => [
    index("workouts_user_version_idx").on(t.userId, t.version),
    index("workouts_user_started_idx").on(t.userId, t.startedAt),
  ],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").primaryKey(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    notes: text("notes"),
    supersetId: integer("superset_id"),
  },
  (t) => [index("workout_exercises_workout_idx").on(t.workoutId)],
);

export const sets = pgTable(
  "sets",
  {
    id: uuid("id").primaryKey(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: setType("type").notNull(),
    weightKg: doublePrecision("weight_kg"),
    reps: integer("reps"),
    rpe: doublePrecision("rpe"),
    durationSeconds: integer("duration_seconds"),
    distanceMeters: integer("distance_meters"),
  },
  (t) => [index("sets_workout_exercise_idx").on(t.workoutExerciseId)],
);

export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey(),
    userId: owner(),
    name: text("name").notNull(),
    notes: text("notes"),
    position: integer("position").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: version(),
  },
  (t) => [index("routines_user_version_idx").on(t.userId, t.version)],
);

export const routineExercises = pgTable(
  "routine_exercises",
  {
    id: uuid("id").primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    restSeconds: integer("rest_seconds"),
    notes: text("notes"),
    supersetId: integer("superset_id"),
  },
  (t) => [index("routine_exercises_routine_idx").on(t.routineId)],
);

export const routineSets = pgTable(
  "routine_sets",
  {
    id: uuid("id").primaryKey(),
    routineExerciseId: uuid("routine_exercise_id")
      .notNull()
      .references(() => routineExercises.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: setType("type").notNull(),
    weightKg: doublePrecision("weight_kg"),
    reps: integer("reps"),
    repsMax: integer("reps_max"),
    durationSeconds: integer("duration_seconds"),
    distanceMeters: integer("distance_meters"),
  },
  (t) => [index("routine_sets_exercise_idx").on(t.routineExerciseId)],
);

/** Exercises a user created. Catalogue exercises are not stored on the server. */
export const customExercises = pgTable(
  "custom_exercises",
  {
    id: text("id").notNull(),
    userId: owner(),
    name: text("name").notNull(),
    trackingType: trackingType("tracking_type").notNull(),
    equipment: text("equipment"),
    primaryMuscle: text("primary_muscle"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: version(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("custom_exercises_user_version_idx").on(t.userId, t.version),
  ],
);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  bio: text("bio"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  version: version(),
});

/**
 * Idempotency log: the id of every change already handled. A phone that lost
 * the response and retries the same change gets "skipped" instead of a
 * second write.
 */
export const appliedChanges = pgTable("applied_changes", {
  changeId: uuid("change_id").primaryKey(),
  userId: owner(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Social (read through GraphQL)
// ---------------------------------------------------------------------------

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    index("follows_followee_idx").on(t.followeeId),
  ],
);

export const likes = pgTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.workoutId] }),
    index("likes_workout_idx").on(t.workoutId),
  ],
);

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(user, { fields: [workouts.userId], references: [user.id] }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutExercises.workoutId], references: [workouts.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const routinesRelations = relations(routines, ({ many }) => ({
  exercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one, many }) => ({
  routine: one(routines, { fields: [routineExercises.routineId], references: [routines.id] }),
  sets: many(routineSets),
}));

export const routineSetsRelations = relations(routineSets, ({ one }) => ({
  routineExercise: one(routineExercises, {
    fields: [routineSets.routineExerciseId],
    references: [routineExercises.id],
  }),
}));
