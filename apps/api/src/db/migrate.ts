import { migrate } from "drizzle-orm/postgres-js/migrator";

import { loadEnv } from "../env";
import { createDatabase } from "./client";

export const MIGRATIONS_FOLDER = new URL("../../drizzle", import.meta.url).pathname;

export async function runMigrations(url: string): Promise<void> {
  const { db, close } = createDatabase(url);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMigrations(loadEnv().DATABASE_URL);
  console.log("Migrations applied");
}
