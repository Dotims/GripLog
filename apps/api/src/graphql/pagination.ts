import { clientError } from "./errors";

/**
 * Keyset pagination: the cursor is the (startedAt, id) of the last item seen,
 * and the next page asks for rows strictly "older" than it. Unlike OFFSET,
 * new workouts arriving at the top never shift or duplicate items between pages,
 * and the database jumps straight to the cursor through an index.
 */
export type Cursor = { startedAt: Date; id: string };

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify([cursor.startedAt.toISOString(), cursor.id])).toString(
    "base64url",
  );
}

export function decodeCursor(value: string): Cursor {
  try {
    const [startedAt, id] = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as [
      string,
      string,
    ];
    const date = new Date(startedAt);
    if (Number.isNaN(date.getTime()) || typeof id !== "string") throw new Error("bad cursor");
    return { startedAt: date, id };
  } catch {
    throw clientError("Invalid cursor", "BAD_USER_INPUT");
  }
}

export const MAX_PAGE_SIZE = 50;

export function pageSize(first: number | null | undefined): number {
  return Math.min(Math.max(first ?? 20, 1), MAX_PAGE_SIZE);
}
