/** Base URL of the GripLog API, set per machine in apps/mobile/.env. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const NETWORK_FAILURE =
  /network request failed|fetch failed|failed to connect|connectexception|unable to resolve host|timed? ?out/i;

/** Readable messages for low-level failures such as raw Java exceptions on Android. */
export function readableError(error: unknown, fallback = "Something went wrong"): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message) return fallback;
  if (NETWORK_FAILURE.test(message)) return "Can't reach the GripLog server";
  return message;
}
