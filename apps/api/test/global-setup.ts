import postgres from "postgres";

import { runMigrations } from "../src/db/migrate";

/** Starts every test run from an empty schema with the real migrations applied. */
export default async function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgres://griplog:griplog@localhost:5440/griplog_test";
  const sql = postgres(url, { onnotice: () => {} });
  await sql`drop schema if exists public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;
  await sql.end();
  await runMigrations(url);
}
