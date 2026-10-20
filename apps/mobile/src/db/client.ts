import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync } from "expo-sqlite";

import * as schema from "./schema";

export const DATABASE_NAME = "griplog.db";

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

/**
 * Opens the app's single connection. The open itself is async because on the
 * web SQLite runs in a worker that has to load WebAssembly first; once open,
 * the same connection serves the synchronous calls Drizzle makes everywhere else.
 */
export async function openAppDatabase(): Promise<AppDatabase> {
  // The change listener is what lets useLiveQuery hear about writes.
  const sqlite = await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: true });
  sqlite.execSync("PRAGMA foreign_keys = ON;");
  return drizzle(sqlite, { schema });
}
