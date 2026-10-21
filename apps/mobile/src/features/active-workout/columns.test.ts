import { columnsFor, formatPrevious } from "./columns";

const set = { weightKg: 100, reps: 5, durationSeconds: 90, distanceMeters: 2500 };

describe("columnsFor", () => {
  it("shows weight in the chosen unit and stores kilograms", () => {
    const [weight] = columnsFor("weight_reps", "lb");
    expect(weight!.read(set)).toBe(220.5);
    expect(weight!.write(220.5).weightKg).toBeCloseTo(100.017, 2);
  });

  it("uses kilometres and a clock for cardio", () => {
    const [km, time] = columnsFor("distance_duration", "kg");
    expect(km!.read(set)).toBe(2.5);
    expect(time).toMatchObject({ kind: "duration" });
    expect(time!.write(750)).toEqual({ durationSeconds: 750 });
  });

  it("has a single column for bodyweight and timed exercises", () => {
    expect(columnsFor("reps", "kg").map((c) => c.key)).toEqual(["reps"]);
    expect(columnsFor("duration", "kg").map((c) => c.key)).toEqual(["time"]);
  });
});

describe("formatPrevious", () => {
  it("formats last time's set for the hint", () => {
    expect(
      formatPrevious(
        { type: "normal", weightKg: 80, reps: 8, durationSeconds: null },
        "weight_reps",
        "kg",
      ),
    ).toBe("80 × 8");
    expect(formatPrevious(undefined, "weight_reps", "kg")).toBe("-");
    expect(
      formatPrevious(
        { type: "normal", weightKg: null, reps: null, durationSeconds: 75 },
        "duration",
        "kg",
      ),
    ).toBe("1:15");
  });
});
