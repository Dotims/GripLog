import { create } from "zustand";

import type { Db } from "@/db/types";
import { authHeaders } from "@/features/account/auth-client";
import { feedKey } from "@/features/social/api";
import { API_URL, readableError } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

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
      // The feed shows synced workouts, so a sync that moved data makes it stale.
      if (result.pushed > 0 || result.pulled > 0) {
        void queryClient.invalidateQueries({ queryKey: feedKey });
      }
      return result;
    } catch (error) {
      useSyncState.setState({
        status: "error",
        lastError: readableError(error),
      });
      throw error;
    } finally {
      running = null;
    }
  })();
  return running;
}
