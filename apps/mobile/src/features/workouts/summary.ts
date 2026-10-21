import { totalVolume, workingSetCount, type SetLike } from "@griplog/core";

import { durationSeconds } from "@/lib/dates";

type SummarisableWorkout = {
  startedAt: string;
  endedAt: string;
  exercises: {
    exerciseId?: string;
    exercise: { name: string; images?: string[] };
    sets: SetLike[];
  }[];
  records: unknown[];
};

export type WorkoutSummary = {
  durationSeconds: number;
  volumeKg: number;
  sets: number;
  records: number;
  exercises: { exerciseId?: string; name: string; sets: number; images?: string[] }[];
};

export function summariseWorkout(workout: SummarisableWorkout): WorkoutSummary {
  const allSets = workout.exercises.flatMap((e) => e.sets);
  return {
    durationSeconds: durationSeconds(workout.startedAt, workout.endedAt),
    volumeKg: totalVolume(allSets),
    sets: workingSetCount(allSets),
    records: workout.records.length,
    exercises: workout.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      name: e.exercise.name,
      sets: e.sets.length,
      images: e.exercise.images,
    })),
  };
}
