import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import type * as schema from "./schema";

/**
 * Any synchronous SQLite database with our schema: expo-sqlite in the app,
 * sql.js in tests. Transactions satisfy it too, so repository functions work
 * both standalone and inside a bigger transaction.
 */
export type Db = BaseSQLiteDatabase<"sync", unknown, typeof schema>;
