import { z } from "zod";

import { SET_TYPES, TRACKING_TYPES } from "./sets";

/**
 * The contract between the phone and the API. Sync works on whole aggregates
 * (a workout with its exercises and sets), never on single rows, so the server
 * can store each change in one transaction. Deletes are tombstones: an upsert
 * with deletedAt set. Conflicts resolve last-write-wins on updatedAt.
 */

const id = z.uuid();
const timestamp = z.iso.datetime({ offset: true });
const position = z.int().min(0);

export const syncSetSchema = z.object({
  id,
  position,
  type: z.enum(SET_TYPES),
  weightKg: z.number().min(0).max(2000).nullable(),
  reps: z.int().min(0).max(1000).nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  durationSeconds: z.int().min(0).nullable(),
  distanceMeters: z.int().min(0).nullable(),
});

export const syncWorkoutSchema = z.object({
  id,
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).nullable(),
  startedAt: timestamp,
  endedAt: timestamp,
  routineId: id.nullable(),
  source: z.enum(["app", "hevy"]),
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
  exercises: z
    .array(
      z.object({
        id,
        exerciseId: z.string().min(1).max(120),
        position,
        notes: z.string().max(1000).nullable(),
        sets: z.array(syncSetSchema).max(100),
      }),
    )
    .max(50),
});

export const syncRoutineSchema = z.object({
  id,
  name: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).nullable(),
  position,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
  exercises: z
    .array(
      z.object({
        id,
        exerciseId: z.string().min(1).max(120),
        position,
        restSeconds: z.int().min(0).max(3600).nullable(),
        notes: z.string().max(1000).nullable(),
        sets: z
          .array(
            z.object({
              id,
              position,
              type: z.enum(SET_TYPES),
              weightKg: z.number().min(0).max(2000).nullable(),
              reps: z.int().min(0).max(1000).nullable(),
            }),
          )
          .max(50),
      }),
    )
    .max(50),
});

export const syncCustomExerciseSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  trackingType: z.enum(TRACKING_TYPES),
  equipment: z.string().max(60).nullable(),
  primaryMuscle: z.string().max(60).nullable(),
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
});

export const syncProfileSchema = z.object({
  firstName: z.string().trim().max(60),
  lastName: z.string().trim().max(60),
  bio: z.string().max(300).nullable(),
  updatedAt: timestamp,
});

export const syncChangeSchema = z.discriminatedUnion("entity", [
  z.object({ changeId: id, entity: z.literal("workout"), data: syncWorkoutSchema }),
  z.object({ changeId: id, entity: z.literal("routine"), data: syncRoutineSchema }),
  z.object({ changeId: id, entity: z.literal("exercise"), data: syncCustomExerciseSchema }),
  z.object({ changeId: id, entity: z.literal("profile"), data: syncProfileSchema }),
]);

export const SYNC_PUSH_LIMIT = 50;

export const syncPushRequestSchema = z.object({
  changes: z.array(syncChangeSchema).min(1).max(SYNC_PUSH_LIMIT),
});

export const syncPushResponseSchema = z.object({
  /** Changes written now. */
  applied: z.array(id),
  /** Changes already seen (retries) or older than what the server has. Safe to drop. */
  skipped: z.array(id),
});

export const syncPullResponseSchema = z.object({
  cursor: z.string(),
  hasMore: z.boolean(),
  workouts: z.array(syncWorkoutSchema),
  routines: z.array(syncRoutineSchema),
  exercises: z.array(syncCustomExerciseSchema),
  profile: syncProfileSchema.nullable(),
});

export type SyncSet = z.infer<typeof syncSetSchema>;
export type SyncWorkout = z.infer<typeof syncWorkoutSchema>;
export type SyncRoutine = z.infer<typeof syncRoutineSchema>;
export type SyncCustomExercise = z.infer<typeof syncCustomExerciseSchema>;
export type SyncProfile = z.infer<typeof syncProfileSchema>;
export type SyncChange = z.infer<typeof syncChangeSchema>;
export type SyncEntity = SyncChange["entity"];
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;
