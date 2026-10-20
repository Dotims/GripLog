import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "Generate one with: openssl rand -base64 32"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  PORT: z.coerce.number().int().default(3000),
  /** Browser origins allowed to call the API with cookies, comma separated. */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
});

export type Env = z.infer<typeof schema>;

/** Fails at startup with a readable list instead of crashing on the first request. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
