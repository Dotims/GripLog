import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { uuidV5 } from "./ids";
import { syncWorkoutSchema } from "./sync";

const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const URL_NS = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

describe("uuidV5", () => {
  it("matches the reference implementation", () => {
    // Python: uuid.uuid5(namespace, name)
    expect(uuidV5("python.org", DNS)).toBe("886313e1-3b8a-5372-9b90-0c9aee199e5d");
    expect(uuidV5("", DNS)).toBe("4ebd0208-8328-5d69-8c44-ec50939c0967");
    expect(uuidV5("https://example.com/zażółć 💪", URL_NS)).toBe(
      "7ce76021-35bd-53e0-93be-decf2a625dd6",
    );
  });

  it("hashes names longer than one SHA-1 block", () => {
    const name = "Bench Press (Barbell) ".repeat(20);
    const ns = Buffer.from(DNS.replaceAll("-", ""), "hex");
    const digest = createHash("sha1")
      .update(Buffer.concat([ns, Buffer.from(name)]))
      .digest();
    const bytes = digest.subarray(0, 16);
    bytes[6] = (bytes[6]! & 0x0f) | 0x50;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    expect(uuidV5(name, DNS).replaceAll("-", "")).toBe(bytes.toString("hex"));
  });

  it("passes the sync contract's id check", () => {
    const id = uuidV5("workout", DNS);
    expect(syncWorkoutSchema.shape.id.safeParse(id).success).toBe(true);
  });
});
