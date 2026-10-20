import { columnsFor, formatPrevious } from "./columns";

const set = { weightKg: 100, reps: 5, durationSeconds: 90, distanceMeters: 2500 };

describe("columnsFor", () => {
  it("shows weight in the chosen unit and stores kilograms", () => {
    const [weight] = columnsFor("weight_reps", "lb");
    expect(weight!.read(set)).toBe(220.5);
    expect(weight!.write(220.5).weightKg).toBeCloseTo(100.017, 2);
  });

  it("uses kilometres and minutes for cardio", () => {
    const [km, minutes] = columnsFor("distance_duration", "kg");
    expect(km!.read(set)).toBe(2.5);
    expect(minutes!.write(12.5)).toEqual({ durationSeconds: 750 });
  });

  it("has a single column for bodyweight and timed exercises", () => {
    expect(columnsFor("reps", "kg").map((c) => c.key)).toEqual(["reps"]);
    expect(columnsFor("duration", "kg").map((c) => c.key)).toEqual(["seconds"]);
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
  });
});
