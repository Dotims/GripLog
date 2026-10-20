import { useDatabase } from "@/db/DatabaseProvider";
import { profile } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";

import { profileQuery } from "./repository";

export function useProfile() {
  const db = useDatabase();
  return useLiveQuery(() => profileQuery(db).get(), [profile]);
}
