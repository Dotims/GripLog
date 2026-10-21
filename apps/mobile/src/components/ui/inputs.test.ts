import { parseDurationDigits } from "./DurationInput";
import { parseRepRange } from "./RepRangeInput";

describe("parseDurationDigits", () => {
  it("reads digits like a stopwatch", () => {
    expect(parseDurationDigits("")).toBeNull();
    expect(parseDurationDigits("5")).toBe(5);
    expect(parseDurationDigits("130")).toBe(90);
    expect(parseDurationDigits("1000")).toBe(600);
  });
});

describe("parseRepRange", () => {
  it("reads a fixed target, a range and half-typed text", () => {
    expect(parseRepRange("8")).toEqual({ reps: 8, repsMax: null });
    expect(parseRepRange("8-12")).toEqual({ reps: 8, repsMax: 12 });
    expect(parseRepRange("8-")).toEqual({ reps: 8, repsMax: null });
    expect(parseRepRange("12-8")).toEqual({ reps: 12, repsMax: null });
    expect(parseRepRange("")).toEqual({ reps: null, repsMax: null });
  });
});
