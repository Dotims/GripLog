import { RECORD_KINDS, SET_TYPES, TRACKING_TYPES } from "@griplog/core";
import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Timestamps are ISO 8601 strings: they sort correctly as text and survive JSON untouched.
const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    trackingType: text("tracking_type", { enum: TRACKING_TYPES }).notNull(),
    category: text("category"),
    equipment: text("equipment"),
    level: text("level"),
    primaryMuscles: text("primary_muscles", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    secondaryMuscles: text("secondary_muscles", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    instructions: text("instructions", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    images: text("images", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (t) => [index("exercises_name_idx").on(t.name)],
);

export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  position: integer("position").notNull().default(0),
  ...timestamps,
  deletedAt: text("deleted_at"),
});

export const routineExercises = sqliteTable(
  "routine_exercises",
  {
    id: text("id").primaryKey(),
    routineId: text("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id),
    position: integer("position").notNull(),
    restSeconds: integer("rest_seconds"),
    notes: text("notes"),
    // Neighbours with the same number are done as a superset.
    supersetId: integer("superset_id"),
  },
  (t) => [index("routine_exercises_routine_idx").on(t.routineId)],
);

export const routineSets = sqliteTable(
  "routine_sets",
  {
    id: text("id").primaryKey(),
    routineExerciseId: text("routine_exercise_id")
      .notNull()
      .references(() => routineExercises.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type", { enum: SET_TYPES }).notNull().default("normal"),
    weightKg: real("weight_kg"),
    // With repsMax set, reps is the bottom of a rep range ("8-12").
    reps: integer("reps"),
    repsMax: integer("reps_max"),
    durationSeconds: integer("duration_seconds"),
    distanceMeters: integer("distance_meters"),
  },
  (t) => [index("routine_sets_exercise_idx").on(t.routineExerciseId)],
);

export const workouts = sqliteTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    notes: text("notes"),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at").notNull(),
    // No foreign key: deleting a routine must not touch the history made from it.
    routineId: text("routine_id"),
    source: text("source", { enum: ["app", "hevy"] })
      .notNull()
      .default("app"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (t) => [index("workouts_started_at_idx").on(t.startedAt)],
);

export const workoutExercises = sqliteTable(
  "workout_exercises",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id),
    position: integer("position").notNull(),
    notes: text("notes"),
    supersetId: integer("superset_id"),
  },
  (t) => [
    index("workout_exercises_workout_idx").on(t.workoutId),
    index("workout_exercises_exercise_idx").on(t.exerciseId),
  ],
);

export const sets = sqliteTable(
  "sets",
  {
    id: text("id").primaryKey(),
    workoutExerciseId: text("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type", { enum: SET_TYPES }).notNull().default("normal"),
    weightKg: real("weight_kg"),
    reps: integer("reps"),
    rpe: real("rpe"),
    durationSeconds: integer("duration_seconds"),
    distanceMeters: integer("distance_meters"),
  },
  (t) => [index("sets_workout_exercise_idx").on(t.workoutExerciseId)],
);

export const personalRecords = sqliteTable(
  "personal_records",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    setId: text("set_id")
      .notNull()
      .references(() => sets.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: RECORD_KINDS }).notNull(),
    value: real("value").notNull(),
    achievedAt: text("achieved_at").notNull(),
  },
  (t) => [
    index("personal_records_exercise_idx").on(t.exerciseId),
    index("personal_records_workout_idx").on(t.workoutId),
  ],
);

/** Photos stay on the phone: they are not part of the sync contract. */
export const workoutPhotos = sqliteTable(
  "workout_photos",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    uri: text("uri").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("workout_photos_workout_idx").on(t.workoutId)],
);

/** Single row (id = 1) with the owner's profile and preferences. */
export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  bio: text("bio"),
  avatarUri: text("avatar_uri"),
  unit: text("unit", { enum: ["kg", "lb"] })
    .notNull()
    .default("kg"),
  defaultRestSeconds: integer("default_rest_seconds").notNull().default(120),
  weeklyGoal: integer("weekly_goal").notNull().default(3),
  // A lift to chase, like a 100 kg bench: catalogue or custom exercise id and the target.
  goalExerciseId: text("goal_exercise_id"),
  goalWeightKg: real("goal_weight_kg"),
  soundsEnabled: integer("sounds_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Transactional outbox: every local write enqueues the aggregate it touched in
 * the same transaction, so a change can never be saved without being queued
 * for upload. One row per aggregate; a newer edit replaces the change id.
 */
export const syncOutbox = sqliteTable(
  "sync_outbox",
  {
    changeId: text("change_id").primaryKey(),
    entity: text("entity", { enum: ["workout", "routine", "exercise", "profile"] }).notNull(),
    entityId: text("entity_id").notNull(),
    createdAt: text("created_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    /** Set when the server can never accept this change as it is; cleared by the next edit. */
    blockedReason: text("blocked_reason"),
  },
  (t) => [uniqueIndex("sync_outbox_entity_idx").on(t.entity, t.entityId)],
);

export const keyValue = sqliteTable("key_value", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const routinesRelations = relations(routines, ({ many }) => ({
  exercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one, many }) => ({
  routine: one(routines, { fields: [routineExercises.routineId], references: [routines.id] }),
  exercise: one(exercises, { fields: [routineExercises.exerciseId], references: [exercises.id] }),
  sets: many(routineSets),
}));

export const routineSetsRelations = relations(routineSets, ({ one }) => ({
  routineExercise: one(routineExercises, {
    fields: [routineSets.routineExerciseId],
    references: [routineExercises.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(workoutExercises),
  records: many(personalRecords),
  photos: many(workoutPhotos),
}));

export const workoutPhotosRelations = relations(workoutPhotos, ({ one }) => ({
  workout: one(workouts, { fields: [workoutPhotos.workoutId], references: [workouts.id] }),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutExercises.workoutId], references: [workouts.id] }),
  exercise: one(exercises, { fields: [workoutExercises.exerciseId], references: [exercises.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  workout: one(workouts, { fields: [personalRecords.workoutId], references: [workouts.id] }),
  exercise: one(exercises, { fields: [personalRecords.exerciseId], references: [exercises.id] }),
  set: one(sets, { fields: [personalRecords.setId], references: [sets.id] }),
}));

export type ExerciseRow = typeof exercises.$inferSelect;
export type WorkoutRow = typeof workouts.$inferSelect;
export type SetRow = typeof sets.$inferSelect;
export type RoutineRow = typeof routines.$inferSelect;
export type ProfileRow = typeof profile.$inferSelect;
