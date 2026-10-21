/**
 * Supersets: neighbouring exercises done back to back, one set of each per
 * round, resting only after the last one. Exercises carry a small group
 * number; these helpers keep the groups valid when exercises move or go.
 */
type Grouped = { id: string; supersetId: number | null };

/**
 * A superset only holds neighbours. Splits groups that a move broke apart,
 * unlinks exercises left on their own and renumbers groups from 0.
 */
export function normalizeSupersets<T extends Grouped>(exercises: readonly T[]): T[] {
  const result = exercises.map((e) => ({ ...e }));
  let next = 0;
  let start = 0;
  while (start < result.length) {
    const group = result[start]!.supersetId;
    let end = start + 1;
    while (group !== null && end < result.length && result[end]!.supersetId === group) end++;
    const id = group !== null && end - start > 1 ? next++ : null;
    for (let i = start; i < end; i++) result[i]!.supersetId = id;
    start = end;
  }
  return result;
}

/** Links an exercise with the one below it, joining that one's superset if it has one. */
export function linkWithNext<T extends Grouped>(exercises: readonly T[], id: string): T[] {
  const index = exercises.findIndex((e) => e.id === id);
  const current = exercises[index];
  const below = exercises[index + 1];
  if (!current || !below) return [...exercises];
  const group =
    current.supersetId ??
    below.supersetId ??
    Math.max(-1, ...exercises.map((e) => e.supersetId ?? -1)) + 1;
  return normalizeSupersets(
    exercises.map((e, i) =>
      i === index ||
      i === index + 1 ||
      (below.supersetId !== null && e.supersetId === below.supersetId)
        ? { ...e, supersetId: group }
        : e,
    ),
  );
}

/** Takes an exercise out of its superset; a superset left with one exercise dissolves. */
export function unlink<T extends Grouped>(exercises: readonly T[], id: string): T[] {
  return normalizeSupersets(exercises.map((e) => (e.id === id ? { ...e, supersetId: null } : e)));
}

/** Rest comes after the last exercise of a superset round, or after any exercise outside one. */
export function restsAfter(exercises: readonly Grouped[], id: string): boolean {
  const index = exercises.findIndex((e) => e.id === id);
  const current = exercises[index];
  if (!current || current.supersetId === null) return true;
  return exercises[index + 1]?.supersetId !== current.supersetId;
}

/** "A", "B", ... per superset, in the order they appear. */
export function supersetLetters(exercises: readonly Grouped[]): Map<number, string> {
  const letters = new Map<number, string>();
  for (const e of exercises) {
    if (e.supersetId !== null && !letters.has(e.supersetId)) {
      letters.set(e.supersetId, String.fromCharCode(65 + letters.size));
    }
  }
  return letters;
}

/** Where an exercise sits in its superset, for drawing the connecting rail. */
export function supersetPosition(
  exercises: readonly Grouped[],
  id: string,
): "first" | "middle" | "last" | null {
  const index = exercises.findIndex((e) => e.id === id);
  const current = exercises[index];
  if (!current || current.supersetId === null) return null;
  const linkedAbove = exercises[index - 1]?.supersetId === current.supersetId;
  const linkedBelow = exercises[index + 1]?.supersetId === current.supersetId;
  if (linkedAbove && linkedBelow) return "middle";
  return linkedAbove ? "last" : "first";
}
