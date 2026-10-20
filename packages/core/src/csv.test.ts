import { describe, expect, it } from "vitest";

import { parseCsv, parseCsvRecords } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and line breaks", () => {
    const text = 'a,b,c\r\n"x, y","say ""hi""","multi\nline"\n1,,3';
    expect(parseCsv(text)).toEqual([
      ["a", "b", "c"],
      ["x, y", 'say "hi"', "multi\nline"],
      ["1", "", "3"],
    ]);
  });

  it("strips a byte order mark", () => {
    expect(parseCsv("﻿a,b")).toEqual([["a", "b"]]);
  });

  it("maps rows to objects and skips blank lines", () => {
    expect(parseCsvRecords("name,reps\nSquat,5\n\n")).toEqual([{ name: "Squat", reps: "5" }]);
  });
});
