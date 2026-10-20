import { createAuthClient } from "better-auth/react";

/** Same origin: Vite proxies /api to the server in development, a reverse proxy does it in production. */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
});
