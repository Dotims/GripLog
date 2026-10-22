import { useDatabase } from "@/db/DatabaseProvider";
import { personalRecords, sets, workoutPhotos, workouts } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";

import { workoutDetailQuery, workoutListQuery } from "./repository";

export function useWorkouts(limit?: number) {
  const db = useDatabase();
  return useLiveQuery(
    () => workoutListQuery(db, limit).sync(),
    [workouts, sets, personalRecords, workoutPhotos],
    String(limit),
  );
}

export function useWorkout(workoutId: string) {
  const db = useDatabase();
  return useLiveQuery(
    () => workoutDetailQuery(db, workoutId).sync(),
    [workouts, sets, personalRecords, workoutPhotos],
    workoutId,
  );
}
