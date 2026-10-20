import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";

import type { Database } from "./db/client";
import * as schema from "./db/schema";
import type { Env } from "./env";

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    // expo(): cookie handling for the React Native client. bearer(): lets
    // scripts and the MCP server send "Authorization: Bearer <session token>".
    plugins: [expo(), bearer()],
    trustedOrigins: [...env.CORS_ORIGINS, "griplog://", "exp://"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
