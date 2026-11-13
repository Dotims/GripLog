import { syncPushRequestSchema } from "@griplog/core";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { importNamespaces } from "../db/schema";
import { requireUser } from "../http/require-user";
import type { AppEnv } from "../http/types";
import { pullChanges } from "./pull";
import { applyPush } from "./push";

const pullQuery = z.object({
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const syncRoutes = new Hono<AppEnv>()
  .use(requireUser)
  .post("/push", zValidator("json", syncPushRequestSchema), async (c) => {
    const { changes } = c.req.valid("json");
    return c.json(await applyPush(c.var.db, c.var.user!.id, changes));
  })
  .get("/pull", zValidator("query", pullQuery), async (c) => {
    const { cursor, limit } = c.req.valid("query");
    return c.json(await pullChanges(c.var.db, c.var.user!.id, cursor, limit));
  })
  .get("/namespace", async (c) => {
    const userId = c.var.user!.id;
    await c.var.db.insert(importNamespaces).values({ userId }).onConflictDoNothing();
    const [row] = await c.var.db
      .select({ namespace: importNamespaces.namespace })
      .from(importNamespaces)
      .where(eq(importNamespaces.userId, userId));
    return c.json({ namespace: row!.namespace });
  });
