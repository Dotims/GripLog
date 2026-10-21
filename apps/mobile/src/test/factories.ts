import { randomUUID } from "node:crypto";

import type { SetType } from "@griplog/core";

import { nowIso } from "@/db/ids";
import { exercises } from "@/db/schema";
import type { Db } from "@/db/types";
import type { WorkoutInput } from "@/features/workouts/repository";

export function insertExercise(db: Db, id: string, name = id) {
  const timestamp = nowIso();
  db.insert(exercises)
    .values({ id, name, trackingType: "weight_reps", createdAt: timestamp, updatedAt: timestamp })
    .run();
}

type SetSpec = [weightKg: number | null, reps: number | null, type?: SetType];

export function workoutInput(
  startedAt: string,
  blocks: { exerciseId: string; sets: SetSpec[] }[],
  overrides: Partial<WorkoutInput> = {},
): WorkoutInput {
  return {
    id: randomUUID(),
    title: "Workout",
    notes: null,
    startedAt,
    endedAt: startedAt,
    routineId: null,
    source: "app",
    exercises: blocks.map((block) => ({
      id: randomUUID(),
      exerciseId: block.exerciseId,
      notes: null,
      supersetId: null,
      sets: block.sets.map(([weightKg, reps, type = "normal"]) => ({
        id: randomUUID(),
        type,
        weightKg,
        reps,
        rpe: null,
        durationSeconds: null,
        distanceMeters: null,
      })),
    })),
    ...overrides,
  };
}
