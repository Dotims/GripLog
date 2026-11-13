import { syncNamespaceResponseSchema } from "@griplog/core";
import { eq } from "drizzle-orm";

import { keyValue } from "@/db/schema";
import type { Db } from "@/db/types";
import { authHeaders } from "@/features/account/auth-client";
import { API_URL } from "@/lib/api";

const storageKey = (userId: string) => `import_namespace:${userId}`;
const TIMEOUT_MS = 4000;

/** The account's namespace for import ids: cached after the first fetch, null when signed out or offline. */
export async function importNamespace(db: Db, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const cached = db
    .select()
    .from(keyValue)
    .where(eq(keyValue.key, storageKey(userId)))
    .get();
  if (cached) return cached.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/sync/namespace`, {
      headers: await authHeaders(),
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const { namespace } = syncNamespaceResponseSchema.parse(await response.json());
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
