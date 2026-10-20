import { describe, expect, it } from "vitest";

import {
  formatClock,
  formatDuration,
  formatNumber,
  formatWeight,
  fromDisplayWeight,
  toDisplayWeight,
} from "./format";

describe("format", () => {
  it("groups thousands with a space", () => {
    expect(formatNumber(1234567.25)).toBe("1 234 567.3");
    expect(formatNumber(950)).toBe("950");
    expect(formatNumber(-12000)).toBe("-12 000");
  });

  it("formats weights in either unit", () => {
    expect(formatWeight(100)).toBe("100 kg");
    expect(formatWeight(100, "lb")).toBe("220.5 lb");
  });

  it("round-trips display weights", () => {
    expect(fromDisplayWeight(toDisplayWeight(60, "lb"), "lb")).toBeCloseTo(60, 1);
  });

  it("formats durations and clocks", () => {
    expect(formatDuration(3900)).toBe("1h 05m");
    expect(formatDuration(42 * 60)).toBe("42m");
    expect(formatDuration(35)).toBe("35s");
    expect(formatClock(245)).toBe("4:05");
    expect(formatClock(3729)).toBe("1:02:09");
  });
});
