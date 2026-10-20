import { useDatabase } from "@/db/DatabaseProvider";
import { routineExercises, routines } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";

import { routineDetailQuery, routineListQuery } from "./repository";

export function useRoutines() {
  const db = useDatabase();
  return useLiveQuery(() => routineListQuery(db).sync(), [routines, routineExercises]);
}

export function useRoutine(routineId: string) {
  const db = useDatabase();
  return useLiveQuery(
    () => routineDetailQuery(db, routineId).sync(),
    [routines, routineExercises],
    routineId,
  );
}
