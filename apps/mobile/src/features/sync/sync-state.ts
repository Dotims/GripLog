import { create } from "zustand";

import type { Db } from "@/db/types";
import { authHeaders } from "@/features/account/auth-client";
import { API_URL } from "@/lib/api";

import { httpTransport, syncOnce, type SyncResult } from "./engine";

type SyncState = {
  status: "idle" | "syncing" | "error";
  lastSyncedAt: number | null;
  lastError: string | null;
};

/** Sync progress for the UI. Zustand, because it changes often and is read in a few places. */
export const useSyncState = create<SyncState>()(() => ({
  status: "idle",
  lastSyncedAt: null,
  lastError: null,
}));

const transport = httpTransport(API_URL, authHeaders);
let running: Promise<SyncResult> | null = null;

/** Single flight: a sync that is already running is joined, not started twice. */
export function runSync(db: Db): Promise<SyncResult> {
  running ??= (async () => {
    useSyncState.setState({ status: "syncing" });
    try {
      const result = await syncOnce(db, transport);
      useSyncState.setState({ status: "idle", lastSyncedAt: Date.now(), lastError: null });
      return result;
    } catch (error) {
      useSyncState.setState({
        status: "error",
        lastError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      running = null;
    }
  })();
  return running;
}
