import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import * as schema from "./schema";

export const DATABASE_NAME = "griplog.db";

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

/**
 * After a page reload the browser may not have released the previous tab's
 * lock on the database file yet. Native platforms never hit this.
 */
async function openWithRetry(attempts = Platform.OS === "web" ? 10 : 1): Promise<SQLiteDatabase> {
  for (let attempt = 1; ; attempt++) {
    try {
      // The change listener is what lets useLiveQuery hear about writes.
      return await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: true });
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
}

/**
 * Opens the app's single connection. The open itself is async because on the
 * web SQLite runs in a worker that has to load WebAssembly first; once open,
 * the same connection serves the synchronous calls Drizzle makes everywhere else.
 */
export async function openAppDatabase(): Promise<AppDatabase> {
  const sqlite = await openWithRetry();
  sqlite.execSync("PRAGMA foreign_keys = ON;");
  return drizzle(sqlite, { schema });
}
