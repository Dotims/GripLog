import type { SyncEntity } from "@griplog/core";
import { count, eq, inArray } from "drizzle-orm";

import { newId, nowIso } from "@/db/ids";
import { syncOutbox } from "@/db/schema";
import type { Db } from "@/db/types";

/**
 * Queues an aggregate for upload. Call it inside the same transaction as the
 * write itself. A fresh change id on every edit means a retry of an older
 * upload can never overwrite a newer one on the server.
 */
export function enqueueChange(tx: Db, entity: SyncEntity, entityId: string): void {
  tx.insert(syncOutbox)
    .values({ changeId: newId(), entity, entityId, createdAt: nowIso() })
    .onConflictDoUpdate({
      target: [syncOutbox.entity, syncOutbox.entityId],
      set: { changeId: newId(), createdAt: nowIso(), attempts: 0, lastError: null },
    })
    .run();
}

export function pendingChanges(db: Db, limit: number) {
  return db.select().from(syncOutbox).orderBy(syncOutbox.createdAt).limit(limit).all();
}

export function pendingChangeCount(db: Db): number {
  return db.select({ value: count() }).from(syncOutbox).get()?.value ?? 0;
}

/** Removes uploaded changes by change id, so edits made during the upload stay queued. */
export function acknowledgeChanges(db: Db, changeIds: string[]): void {
  if (changeIds.length === 0) return;
  db.delete(syncOutbox).where(inArray(syncOutbox.changeId, changeIds)).run();
}

export function markChangeFailed(db: Db, changeId: string, error: string): void {
  const row = db.select().from(syncOutbox).where(eq(syncOutbox.changeId, changeId)).get();
  if (!row) return;
  db.update(syncOutbox)
    .set({ attempts: row.attempts + 1, lastError: error })
    .where(eq(syncOutbox.changeId, changeId))
    .run();
}
