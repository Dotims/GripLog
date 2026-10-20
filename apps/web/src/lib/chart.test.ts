import { describe, expect, it } from "vitest";

import { scalePoints, toPath } from "./chart";

describe("scalePoints", () => {
  it("spreads points across the width and puts the highest value on top", () => {
    const points = scalePoints([100, 110, 105], 232, 132, 16);
    expect(points.map((p) => p.x)).toEqual([16, 116, 216]);
    expect(points[1]!.y).toBeLessThan(points[0]!.y);
  });

  it("centres a flat series and a single point", () => {
    expect(scalePoints([80, 80], 200, 100).map((p) => p.y)).toEqual([50, 50]);
    expect(scalePoints([80], 200, 100)).toEqual([{ x: 100, y: 50 }]);
  });

  it("returns nothing for no data", () => {
    expect(scalePoints([], 200, 100)).toEqual([]);
  });
});

describe("toPath", () => {
  it("builds an SVG path", () => {
    expect(
      toPath([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]),
    ).toBe("M1.0,2.0 L3.0,4.0");
  });
});
