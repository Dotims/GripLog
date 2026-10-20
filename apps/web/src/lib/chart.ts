export type ChartPoint = { x: number; y: number };

/**
 * Maps values onto an SVG box. The y axis is flipped (SVG grows downwards) and
 * padded by 10 % so the line never touches the edges. A flat series is centred.
 */
export function scalePoints(
  values: readonly number[],
  width: number,
  height: number,
  padding = 16,
): ChartPoint[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const low = min - spread * 0.1;
  const high = max + spread * 0.1;
  return values.map((value, index) => ({
    x:
      values.length === 1
        ? width / 2
        : padding + (index / (values.length - 1)) * (width - padding * 2),
    y:
      spread === 0
        ? height / 2
        : padding + (1 - (value - low) / (high - low)) * (height - padding * 2),
  }));
}

export function toPath(points: readonly ChartPoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}
