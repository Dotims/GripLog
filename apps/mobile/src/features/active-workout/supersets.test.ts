import {
  linkWithNext,
  normalizeSupersets,
  restsAfter,
  supersetLetters,
  supersetPosition,
  unlink,
} from "./supersets";

const list = (...groups: (number | null)[]) =>
  groups.map((supersetId, i) => ({ id: String.fromCharCode(97 + i), supersetId }));
const groups = (exercises: { supersetId: number | null }[]) => exercises.map((e) => e.supersetId);

describe("supersets", () => {
  it("links an exercise with the one below it", () => {
    expect(groups(linkWithNext(list(null, null, null), "b"))).toEqual([null, 0, 0]);
  });

  it("joins the superset below instead of starting a new one", () => {
    expect(groups(linkWithNext(list(null, 0, 0), "a"))).toEqual([0, 0, 0]);
  });

  it("merges two supersets that end up linked", () => {
    expect(groups(linkWithNext(list(0, 0, 1, 1), "b"))).toEqual([0, 0, 0, 0]);
  });

  it("dissolves a superset left with one exercise", () => {
    expect(groups(unlink(list(0, 0, null), "a"))).toEqual([null, null, null]);
  });

  it("splits a superset that a move broke apart and renumbers from zero", () => {
    expect(groups(normalizeSupersets(list(3, null, 3, 3)))).toEqual([null, null, 0, 0]);
  });

  it("rests only after the last exercise of a superset", () => {
    const exercises = list(0, 0, null);
    expect(restsAfter(exercises, "a")).toBe(false);
    expect(restsAfter(exercises, "b")).toBe(true);
    expect(restsAfter(exercises, "c")).toBe(true);
  });

  it("names supersets in order and places each exercise on the rail", () => {
    const exercises = list(4, 4, 4, null, 2, 2);
    expect([...supersetLetters(exercises)]).toEqual([
      [4, "A"],
      [2, "B"],
    ]);
    expect(["a", "b", "c", "d", "e"].map((id) => supersetPosition(exercises, id))).toEqual([
      "first",
      "middle",
      "last",
      null,
      "first",
    ]);
  });
});
