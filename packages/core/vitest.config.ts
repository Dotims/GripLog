import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Week maths depends on the local calendar, so pin a zone with DST.
    env: { TZ: "Europe/Warsaw" },
  },
});
