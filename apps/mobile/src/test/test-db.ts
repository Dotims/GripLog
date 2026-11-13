import { drizzle } from "drizzle-orm/sql-js";
import { migrate } from "drizzle-orm/sql-js/migrator";
import path from "node:path";
import initSqlJs from "sql.js";

import * as schema from "@/db/schema";
import type { Db } from "@/db/types";

type PreparedQuery = { customResultMapper?: unknown };
type Session = {
  prepareQuery: (...args: unknown[]) => PreparedQuery;
};

/** drizzle-orm 0.45's sql.js session drops the relational query mapper; pass it through. */
function patchRelationalQueries(db: object) {
  const session = (db as { session: Session }).session;
  const prepareQuery = session.prepareQuery.bind(session);
  session.prepareQuery = (...args: unknown[]) => {
    const prepared = prepareQuery(...args);
    prepared.customResultMapper = args[4];
    return prepared;
  };
}

/** In-memory sql.js database with the real migrations applied. */
export async function createTestDb(): Promise<Db> {
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database();
  sqlite.run("PRAGMA foreign_keys = ON;");
  const db = drizzle(sqlite, { schema });
  patchRelationalQueries(db);
  migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  return db;
}
