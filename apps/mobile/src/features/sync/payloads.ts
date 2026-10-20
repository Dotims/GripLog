import type {
  SyncChange,
  SyncCustomExercise,
  SyncProfile,
  SyncRoutine,
  SyncWorkout,
} from "@griplog/core";
import { and, eq } from "drizzle-orm";

import { exercises, profile, routines, workouts } from "@/db/schema";
import type { Db } from "@/db/types";
import { PROFILE_ID } from "@/features/profile/repository";
import { getRoutineInput } from "@/features/routines/repository";
import { getWorkoutInput } from "@/features/workouts/repository";

import type { PendingChange } from "./outbox";

function workoutPayload(db: Db, id: string): SyncWorkout | null {
  const row = db.select().from(workouts).where(eq(workouts.id, id)).get();
  const input = getWorkoutInput(db, id);
  if (!row || !input) return null;
  return {
    ...input,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    exercises: input.exercises.map((exercise, position) => ({
      ...exercise,
      position,
      sets: exercise.sets.map((set, setPosition) => ({ ...set, position: setPosition })),
    })),
  };
}

function routinePayload(db: Db, id: string): SyncRoutine | null {
  const row = db.select().from(routines).where(eq(routines.id, id)).get();
  const input = getRoutineInput(db, id);
  if (!row || !input) return null;
  return {
    ...input,
    position: row.position,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    exercises: input.exercises.map((exercise, position) => ({
      ...exercise,
      position,
      sets: exercise.sets.map((set, setPosition) => ({ ...set, position: setPosition })),
    })),
  };
}

function exercisePayload(db: Db, id: string): SyncCustomExercise | null {
  const row = db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, true)))
    .get();
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    trackingType: row.trackingType,
    equipment: row.equipment,
    primaryMuscle: row.primaryMuscles[0] ?? null,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function profilePayload(db: Db): SyncProfile | null {
  const row = db.select().from(profile).where(eq(profile.id, PROFILE_ID)).get();
  if (!row) return null;
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    bio: row.bio,
    updatedAt: row.updatedAt,
  };
}

/**
 * Reads the current state of a queued aggregate. Building the payload at send
 * time, not at queue time, means five quick edits upload as one change.
 */
export function buildChange(db: Db, pending: PendingChange): SyncChange | null {
  const { changeId, entity, entityId } = pending;
  switch (entity) {
    case "workout": {
      const data = workoutPayload(db, entityId);
      return data && { changeId, entity, data };
    }
    case "routine": {
      const data = routinePayload(db, entityId);
      return data && { changeId, entity, data };
    }
    case "exercise": {
      const data = exercisePayload(db, entityId);
      return data && { changeId, entity, data };
    }
    case "profile": {
      const data = profilePayload(db);
      return data && { changeId, entity, data };
    }
  }
}
