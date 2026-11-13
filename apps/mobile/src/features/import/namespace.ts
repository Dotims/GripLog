import { eq } from "drizzle-orm";

import { keyValue } from "@/db/schema";
import type { Db } from "@/db/types";
import { transport } from "@/features/sync/sync-state";

const storageKey = (userId: string) => `import_namespace:${userId}`;
const TIMEOUT_MS = 4000;

/** The account's namespace for import ids: cached after the first fetch, null when signed out or offline. */
export async function importNamespace(
  db: Db,
  userId: string | null,
  fetchNamespace: () => Promise<string> = transport.namespace,
): Promise<string | null> {
  if (!userId) return null;
  const cached = db
    .select()
    .from(keyValue)
    .where(eq(keyValue.key, storageKey(userId)))
    .get();
  if (cached) return cached.value;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const namespace = await Promise.race([
      fetchNamespace(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
      }),
    ]);
    db.insert(keyValue)
      .values({ key: storageKey(userId), value: namespace })
      .onConflictDoNothing()
      .run();
    return namespace;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
