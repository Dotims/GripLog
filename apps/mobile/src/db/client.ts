import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import * as schema from "./schema";

const DATABASE_NAME = "griplog.db";

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

/** After a web reload the previous tab may still hold the database lock. */
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

/** Async: on the web SQLite loads as WebAssembly in a worker. */
export async function openAppDatabase(): Promise<AppDatabase> {
  const sqlite = await openWithRetry();
  sqlite.execSync("PRAGMA foreign_keys = ON;");
  return drizzle(sqlite, { schema });
}
