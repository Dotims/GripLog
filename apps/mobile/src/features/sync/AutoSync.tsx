import NetInfo from "@react-native-community/netinfo";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useDatabase } from "@/db/DatabaseProvider";
import { useSession } from "@/features/account/SessionProvider";

import { runSync } from "./sync-state";

/** Waits this long after the last local write, so a burst of edits uploads once. */
const DEBOUNCE_MS = 3000;

/**
 * Syncs in the background while signed in: on start, when the app comes to the
 * foreground, when the network comes back, and shortly after local changes.
 * Renders nothing.
 */
export function AutoSync() {
  const db = useDatabase();
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;
    const sync = () => runSync(db).catch(() => {});
    let timer: ReturnType<typeof setTimeout> | null = null;
    const later = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sync, DEBOUNCE_MS);
    };

    sync();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    let wasOnline = true;
    const unsubscribeNet = NetInfo.addEventListener((net) => {
      const online = net.isConnected === true;
      if (online && !wasOnline) sync();
      wasOnline = online;
    });
    const outbox = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === "sync_outbox") later();
    });

    return () => {
      if (timer) clearTimeout(timer);
      appState.remove();
      unsubscribeNet();
      outbox.remove();
    };
  }, [db, user]);

  return null;
}
