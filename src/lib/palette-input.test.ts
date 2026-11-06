import { describe, expect, it } from "vitest";
import { parsePaletteId } from "./palette-input";

describe("parsePaletteId", () => {
  it.each([
    ["7", 7],
    [7, 7],
    ["2147483647", 2147483647],
  ])("accepts %j", (value, id) => {
    expect(parsePaletteId(value)).toBe(id);
  });

  it.each([["0"], ["-1"], ["1.5"], ["abc"], ["2147483648"], [1.5], [null]])(
    "rejects %j",
    (value) => {
      expect(parsePaletteId(value)).toBeNull();
    },
  );
});
