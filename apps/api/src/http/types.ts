import type { Auth } from "../auth";
import type { Database } from "../db/client";

export type SessionUser = Auth["$Infer"]["Session"]["user"];

/** Typed context for every Hono route: c.var.user is set by the session middleware. */
export type AppEnv = {
  Variables: {
    db: Database;
    user: SessionUser | null;
  };
};
