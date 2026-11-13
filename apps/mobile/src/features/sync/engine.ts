import {
  SYNC_PUSH_LIMIT,
  syncChangeSchema,
  syncPullResponseSchema,
  syncPushResponseSchema,
  type SyncChange,
  type SyncPullResponse,
  type SyncPushResponse,
} from "@griplog/core";

import type { Db } from "@/db/types";

import { applyPulledPage, readCursor } from "./apply";
import { acknowledgeChanges, blockChange, markChangeFailed, pendingChanges } from "./outbox";
import { buildChange } from "./payloads";

/** Small pages keep each local transaction short. */
const PULL_PAGE_SIZE = 50;

export type SyncTransport = {
  push: (changes: SyncChange[]) => Promise<SyncPushResponse>;
  pull: (cursor: number) => Promise<SyncPullResponse>;
};

export type SyncResult = { pushed: number; pulled: number };

function validate(db: Db, change: SyncChange): boolean {
  const result = syncChangeSchema.safeParse(change);
  if (result.success) return true;
  const issue = result.error.issues[0];
  blockChange(db, change.changeId, `${issue?.path.join(".")}: ${issue?.message}`);
  return false;
}

/** A 400 or 413 for the batch is retried change by change to find the bad one. */
async function sendBatch(
  db: Db,
  transport: SyncTransport,
  changes: SyncChange[],
): Promise<SyncPushResponse> {
  try {
    return await transport.push(changes);
  } catch (error) {
    if (!(error instanceof SyncHttpError) || (error.status !== 400 && error.status !== 413))
      throw error;
    if (changes.length === 1) {
      const reason = error.status === 413 ? "Too large for the server" : "Rejected by the server";
      blockChange(db, changes[0]!.changeId, reason);
      return { applied: [], skipped: [] };
    }
    const merged: SyncPushResponse = { applied: [], skipped: [] };
    for (const change of changes) {
      const one = await sendBatch(db, transport, [change]);
      merged.applied.push(...one.applied);
      merged.skipped.push(...one.skipped);
    }
    return merged;
  }
}

export async function pushPending(db: Db, transport: SyncTransport): Promise<number> {
  let pushed = 0;
  for (;;) {
    const pending = pendingChanges(db, SYNC_PUSH_LIMIT);
    if (pending.length === 0) return pushed;

    const changes: SyncChange[] = [];
    const vanished: string[] = [];
    for (const row of pending) {
      const change = buildChange(db, row);
      if (!change) vanished.push(row.changeId);
      else if (validate(db, change)) changes.push(change);
    }
    // Rows deleted locally before they were ever uploaded have nothing to send.
    acknowledgeChanges(db, vanished);
    if (changes.length === 0) continue;

    try {
      const response = await sendBatch(db, transport, changes);
      const handled = [...response.applied, ...response.skipped];
      // Applied and skipped both mean "the server has dealt with it".
      acknowledgeChanges(db, handled);
      pushed += response.applied.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const change of changes) markChangeFailed(db, change.changeId, message);
      throw error;
    }
  }
}

export async function pullRemote(db: Db, transport: SyncTransport): Promise<number> {
  let pulled = 0;
  for (;;) {
    const cursor = readCursor(db);
    const page = await transport.pull(cursor);
    pulled += applyPulledPage(db, page).applied;
    if (!page.hasMore || Number(page.cursor) === cursor) return pulled;
  }
}

/** Push first, so the server has the local edits before the pull. */
export async function syncOnce(db: Db, transport: SyncTransport): Promise<SyncResult> {
  const pushed = await pushPending(db, transport);
  const pulled = await pullRemote(db, transport);
  return { pushed, pulled };
}

export class SyncHttpError extends Error {
  override name = "SyncHttpError";
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Responses are validated, so a broken server cannot corrupt local data. */
export function httpTransport(
  baseUrl: string,
  headers: () => Promise<Record<string, string>>,
): SyncTransport {
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(await headers()), ...init?.headers },
      // Native sends the cookie header itself; the web build relies on the browser cookie.
      credentials: "include",
    });
    if (!response.ok)
      throw new SyncHttpError(response.status, `${path} failed with ${response.status}`);
    return response.json();
  };
  return {
    push: async (changes) =>
      syncPushResponseSchema.parse(
        await request("/sync/push", { method: "POST", body: JSON.stringify({ changes }) }),
      ),
    pull: async (cursor) =>
      syncPullResponseSchema.parse(
        await request(`/sync/pull?cursor=${cursor}&limit=${PULL_PAGE_SIZE}`),
      ),
  };
}
