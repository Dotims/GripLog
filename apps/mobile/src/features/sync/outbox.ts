import type { SyncEntity } from "@griplog/core";
import { and, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { newId, nowIso } from "@/db/ids";
import { syncOutbox } from "@/db/schema";
import type { Db } from "@/db/types";

/** Call inside the write's transaction; every edit gets a fresh change id. */
export function enqueueChange(tx: Db, entity: SyncEntity, entityId: string): void {
  tx.insert(syncOutbox)
    .values({ changeId: newId(), entity, entityId, createdAt: nowIso() })
    .onConflictDoUpdate({
      target: [syncOutbox.entity, syncOutbox.entityId],
      set: {
        changeId: newId(),
        createdAt: nowIso(),
        attempts: 0,
        lastError: null,
        blockedReason: null,
      },
    })
    .run();
}

/** Changes ready to upload, oldest first; blocked ones wait for an edit. */
export function pendingChanges(db: Db, limit: number) {
  return db
    .select()
    .from(syncOutbox)
    .where(isNull(syncOutbox.blockedReason))
    .orderBy(syncOutbox.createdAt)
    .limit(limit)
    .all();
}

export function pendingChangeCount(db: Db): number {
  return (
    db.select({ value: count() }).from(syncOutbox).where(isNull(syncOutbox.blockedReason)).get()
      ?.value ?? 0
  );
}

export function blockedChanges(db: Db) {
  return db.select().from(syncOutbox).where(isNotNull(syncOutbox.blockedReason)).all();
}

/** Parks a change the server will never accept; the next edit of the aggregate unblocks it. */
export function blockChange(db: Db, changeId: string, reason: string): void {
  db.update(syncOutbox)
    .set({ blockedReason: reason })
    .where(eq(syncOutbox.changeId, changeId))
    .run();
}

/** By change id, so edits made during the upload stay queued. */
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

export type PendingChange = typeof syncOutbox.$inferSelect;

export function hasPendingChange(db: Db, entity: SyncEntity, entityId: string): boolean {
  return (
    db
      .select({ changeId: syncOutbox.changeId })
      .from(syncOutbox)
      .where(and(eq(syncOutbox.entity, entity), eq(syncOutbox.entityId, entityId)))
      .get() !== undefined
  );
}
