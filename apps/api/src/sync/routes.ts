import { syncPushRequestSchema } from "@griplog/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { requireUser } from "../http/require-user";
import type { AppEnv } from "../http/types";
import { pullChanges } from "./pull";
import { applyPush } from "./push";

const pullQuery = z.object({
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

/**
 * REST for sync: two endpoints with a fixed contract, plain HTTP caching rules
 * and status codes. Writes are commands ("apply these changes"), which is
 * where REST is simpler than GraphQL mutations.
 */
export const syncRoutes = new Hono<AppEnv>()
  .use(requireUser)
  .post("/push", zValidator("json", syncPushRequestSchema), async (c) => {
    const { changes } = c.req.valid("json");
    return c.json(await applyPush(c.var.db, c.var.user!.id, changes));
  })
  .get("/pull", zValidator("query", pullQuery), async (c) => {
    const { cursor, limit } = c.req.valid("query");
    return c.json(await pullChanges(c.var.db, c.var.user!.id, cursor, limit));
  });
