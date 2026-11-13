import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import type * as schema from "./schema";

/** expo-sqlite in the app, sql.js in tests; a transaction fits too. */
export type Db = BaseSQLiteDatabase<"sync", unknown, typeof schema>;
