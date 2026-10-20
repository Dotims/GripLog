import { useDatabase } from "@/db/DatabaseProvider";
import { exercises, personalRecords, sets, workoutExercises, workouts } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";

import {
  exerciseHistoryQuery,
  exerciseQuery,
  exerciseUsageQuery,
  listExercisesQuery,
} from "./repository";

export function useExercises() {
  const db = useDatabase();
  return useLiveQuery(() => listExercisesQuery(db).all(), [exercises]);
}

export function useExercise(id: string) {
  const db = useDatabase();
  return useLiveQuery(() => exerciseQuery(db, id).get(), [exercises], id);
}

export function useExerciseUsage() {
  const db = useDatabase();
  return useLiveQuery(
    () =>
      new Map(
        exerciseUsageQuery(db)
          .all()
          .map((row) => [row.exerciseId, row.uses]),
      ),
    [workoutExercises, workouts],
  );
}

export function useExerciseHistory(exerciseId: string) {
  const db = useDatabase();
  return useLiveQuery(
    () => exerciseHistoryQuery(db, exerciseId).all(),
    [sets, workouts],
    exerciseId,
  );
}

export function useExerciseRecords(exerciseId: string) {
  const db = useDatabase();
  return useLiveQuery(
    () =>
      db.query.personalRecords
        .findMany({ where: (r, { eq }) => eq(r.exerciseId, exerciseId) })
        .sync(),
    [personalRecords],
    exerciseId,
  );
}
