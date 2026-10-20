import { describe, expect, it } from "vitest";

import { findNewRecords, mergeBests } from "./records";
import type { SetLike } from "./sets";

const s = (weightKg: number | null, reps: number, type: SetLike["type"] = "normal"): SetLike => ({
  type,
  weightKg,
  reps,
});

describe("findNewRecords", () => {
  it("treats every best as a record the first time an exercise is logged", () => {
    const records = findNewRecords({}, [s(80, 8), s(90, 5)]);
    expect(records.map((r) => r.kind)).toEqual(["weight", "one_rep_max", "set_volume"]);
    expect(records.find((r) => r.kind === "weight")).toMatchObject({ value: 90, setIndex: 1 });
    expect(records.find((r) => r.kind === "set_volume")).toMatchObject({ value: 640, setIndex: 0 });
  });

  it("only reports kinds that beat the previous best", () => {
    const records = findNewRecords({ weight: 100, one_rep_max: 105, set_volume: 500 }, [s(95, 6)]);
    expect(records.map((r) => r.kind)).toEqual(["one_rep_max", "set_volume"]);
  });

  it("does not count a tie as a record", () => {
    expect(findNewRecords({ weight: 100, one_rep_max: 100, set_volume: 100 }, [s(100, 1)])).toEqual(
      [],
    );
  });

  it("ignores warm-ups even when they are heavier", () => {
    const records = findNewRecords({}, [s(140, 1, "warmup"), s(100, 5)]);
    expect(records.find((r) => r.kind === "weight")?.value).toBe(100);
  });

  it("tracks most reps for bodyweight sets only", () => {
    expect(findNewRecords({ reps: 10 }, [s(null, 12), s(null, 8)])).toEqual([
      { kind: "reps", value: 12, setIndex: 0 },
    ]);
  });
});

describe("mergeBests", () => {
  it("overwrites the kinds that got a new record", () => {
    expect(
      mergeBests({ weight: 100, reps: 5 }, [{ kind: "weight", value: 110, setIndex: 0 }]),
    ).toEqual({
      weight: 110,
      reps: 5,
    });
  });
});
