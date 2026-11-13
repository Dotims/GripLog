import { createHmac } from "node:crypto";

/** HMAC of the user id, so no other account can predict the ids a phone derives in it. */
export function importNamespace(secret: string, userId: string): string {
  const bytes = createHmac("sha256", secret)
    .update(`griplog-import-namespace:${userId}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
