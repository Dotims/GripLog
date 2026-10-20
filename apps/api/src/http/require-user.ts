import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import type { AppEnv, SessionUser } from "./types";

/** 401 unless the request carries a valid session cookie or bearer token. */
export const requireUser = createMiddleware<AppEnv & { Variables: { user: SessionUser } }>(
  async (c, next) => {
    if (!c.var.user) throw new HTTPException(401, { message: "Sign in first" });
    await next();
  },
);
