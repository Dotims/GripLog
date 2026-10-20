import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { createDatabase } from "./db/client";
import { runMigrations } from "./db/migrate";
import { loadEnv } from "./env";

const env = loadEnv();
await runMigrations(env.DATABASE_URL);

const { db, close } = createDatabase(env.DATABASE_URL);
const app = createApp({ db, auth: createAuth(db, env), env, log: true });

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`GripLog API on http://localhost:${info.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close();
    close().finally(() => process.exit(0));
  });
}
