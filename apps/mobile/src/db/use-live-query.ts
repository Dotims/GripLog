import { getTableName, type Table } from "drizzle-orm";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useState, useSyncExternalStore } from "react";

type LiveStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
};

/** Wraps a synchronous query as an external store that re-reads when its tables change. */
export function createLiveStore<T>(load: () => T, tables: readonly Table[]): LiveStore<T> {
  let snapshot = load();
  const watched = new Set(tables.map((table) => getTableName(table)));

  return {
    getSnapshot: () => snapshot,
    subscribe: (onChange) => {
      let scheduled: ReturnType<typeof setTimeout> | null = null;
      const subscription = addDatabaseChangeListener(({ tableName }) => {
        if (!watched.has(tableName) || scheduled) return;
        // All row events from one transaction arrive together; read once for all of them.
        scheduled = setTimeout(() => {
          scheduled = null;
          snapshot = load();
          onChange();
        }, 16);
      });
      return () => {
        subscription.remove();
        if (scheduled) clearTimeout(scheduled);
      };
    },
  };
}

/**
 * Reads data synchronously and re-reads it whenever one of `tables` changes.
 *
 * Why not drizzle's useLiveQuery: it watches only the query's root table, re-runs
 * once per changed row (an import of 2 654 sets means 2 654 re-runs), and starts
 * with an empty result. Here the first render already has data, and a whole
 * transaction collapses into one re-read. useSyncExternalStore is the same
 * primitive Zustand uses, so React never renders two different snapshots in one pass.
 */
export function useLiveQuery<T>(load: () => T, tables: readonly Table[], key = ""): T {
  const [entry, setEntry] = useState(() => ({ key, store: createLiveStore(load, tables) }));
  let store = entry.store;
  // `key` names the query (for example the id it reads). A new key means a new store,
  // swapped in during render, which React allows for state derived from props.
  if (entry.key !== key) {
    store = createLiveStore(load, tables);
    setEntry({ key, store });
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
