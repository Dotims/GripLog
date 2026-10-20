import { formatRelativeDay, workoutTitleForNow } from "./dates";

describe("formatRelativeDay", () => {
  const now = new Date(2026, 9, 21, 12, 0);

  it("names today and yesterday", () => {
    expect(formatRelativeDay(new Date(2026, 9, 21, 7, 0).toISOString(), now)).toBe("Today");
    expect(formatRelativeDay(new Date(2026, 9, 20, 23, 30).toISOString(), now)).toBe("Yesterday");
  });

  it("shows weekday and date this year, and the year otherwise", () => {
    expect(formatRelativeDay(new Date(2026, 9, 13, 18, 0).toISOString(), now)).toBe("Tue 13 Oct");
    expect(formatRelativeDay(new Date(2024, 1, 21, 9, 0).toISOString(), now)).toBe("21 Feb 2024");
  });
});

describe("workoutTitleForNow", () => {
  it("follows the time of day", () => {
    expect(workoutTitleForNow(new Date(2026, 9, 21, 7))).toBe("Morning workout");
    expect(workoutTitleForNow(new Date(2026, 9, 21, 18))).toBe("Evening workout");
  });
});
