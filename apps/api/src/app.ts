import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import type { Auth } from "./auth";
import type { Database } from "./db/client";
import type { Env } from "./env";
import type { AppEnv } from "./http/types";
import { createLoaders } from "./graphql/loaders";
import { yoga } from "./graphql/yoga";
import { requireUser } from "./http/require-user";
import { syncRoutes } from "./sync/routes";

type Dependencies = { db: Database; auth: Auth; env: Env; log?: boolean };

// A full batch of typical workouts is a few hundred kB; the phone splits anything larger.
export const PUSH_BODY_LIMIT = 4 * 1024 * 1024;

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

  app.get("/health", (c) => c.json({ ok: true }));
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.use("*", async (c, next) => {
    c.set("db", db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null);
    await next();
  });

  app.use(
    "/sync/push",
    bodyLimit({
      maxSize: PUSH_BODY_LIMIT,
      onError: (c) => c.json({ error: "Payload too large" }, 413),
    }),
  );
  app.route("/sync", syncRoutes);
  app.on(["GET", "POST"], "/graphql", requireUser, (c) => {
    const viewer = c.var.user!;
    // Loaders are created per request so their cache never leaks between users.
    return yoga.fetch(c.req.raw, { db, viewer, loaders: createLoaders(db, viewer.id) });
  });

  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
