/** Base URL of the GripLog API, set per machine in apps/mobile/.env. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
