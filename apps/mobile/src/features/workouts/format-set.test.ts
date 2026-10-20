import { formatSetValue } from "./format-set";

const set = { weightKg: 80, reps: 8, durationSeconds: 900, distanceMeters: 2500 };

describe("formatSetValue", () => {
  it("formats each way of measuring", () => {
    expect(formatSetValue(set, "weight_reps", "kg")).toBe("80 kg × 8");
    expect(formatSetValue({ ...set, weightKg: null }, "reps", "kg")).toBe("8 reps");
    expect(formatSetValue(set, "duration", "kg")).toBe("15m");
    expect(formatSetValue(set, "distance_duration", "kg")).toBe("2.5 km · 15m");
  });

  it("shows added weight on bodyweight exercises", () => {
    expect(formatSetValue({ ...set, weightKg: 10 }, "reps", "kg")).toBe("+10 kg × 8");
  });
});
