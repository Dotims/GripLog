import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import type { Auth } from "./auth";
import type { Database } from "./db/client";
import type { Env } from "./env";
import type { AppEnv } from "./http/types";
import { syncRoutes } from "./sync/routes";

type Dependencies = { db: Database; auth: Auth; env: Env; log?: boolean };

export function createApp({ db, auth, env, log = false }: Dependencies) {
  const app = new Hono<AppEnv>();

  if (log) app.use(logger());
  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  // Resolve the session once per request; routes decide whether they need it.
  app.use("*", async (c, next) => {
    c.set("db", db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null);
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/sync", syncRoutes);

  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
