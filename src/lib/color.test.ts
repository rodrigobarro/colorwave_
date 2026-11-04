import { describe, expect, it } from "vitest";
import {
  fromHex,
  generateColors,
  getGamut,
  harmonies,
  isPaletteColors,
  MAX_CHROMA,
  MAX_COLORS,
  MIN_COLORS,
  mixColors,
  readableOn,
  toCss,
  toHex,
  type Harmony,
  type Oklch,
} from "@/lib/color";

const color: Oklch = [0.5, 0.1, 200];

function palette(length: number) {
  return Array.from({ length }, () => color);
}

describe("isPaletteColors", () => {
  it("accepts palettes from the minimum to the maximum size", () => {
    expect(isPaletteColors(palette(MIN_COLORS))).toBe(true);
    expect(isPaletteColors(palette(MAX_COLORS))).toBe(true);
  });

  it("rejects palettes with too few or too many colors", () => {
    expect(isPaletteColors(palette(MIN_COLORS - 1))).toBe(false);
    expect(isPaletteColors(palette(MAX_COLORS + 1))).toBe(false);
  });

  it("rejects values that are not arrays of colors", () => {
    expect(isPaletteColors(null)).toBe(false);
    expect(isPaletteColors("oklch(0.5 0.1 200)")).toBe(false);
    expect(isPaletteColors({ 0: color, 1: color, length: 2 })).toBe(false);
  });

  it("accepts coordinates on the edges of their ranges", () => {
    expect(
      isPaletteColors([
        [0, 0, 0],
        [1, MAX_CHROMA, 360],
      ]),
    ).toBe(true);
  });

  it.each<[string, unknown]>([
    ["two coordinates", [0.5, 0.1]],
    ["four coordinates", [0.5, 0.1, 200, 1]],
    ["a string coordinate", ["0.5", 0.1, 200]],
    ["NaN", [Number.NaN, 0.1, 200]],
    ["Infinity", [0.5, Number.POSITIVE_INFINITY, 200]],
    ["lightness below 0", [-0.01, 0.1, 200]],
    ["lightness above 1", [1.01, 0.1, 200]],
    ["negative chroma", [0.5, -0.01, 200]],
    ["chroma above the maximum", [0.5, MAX_CHROMA + 0.01, 200]],
    ["negative hue", [0.5, 0.1, -1]],
    ["hue above 360", [0.5, 0.1, 361]],
  ])("rejects a color with %s", (_, invalid) => {
    expect(isPaletteColors([color, invalid])).toBe(false);
  });
});

describe("fromHex", () => {
  it("converts hex to rounded OKLCH", () => {
    expect(fromHex("#ff0000")).toEqual([0.628, 0.2577, 29.23]);
  });

  it("uses 0 for the hue of neutral colors", () => {
    expect(fromHex("#ffffff")).toEqual([1, 0, 0]);
  });
});

describe("toHex", () => {
  it("round-trips sRGB colors as six-digit uppercase hex", () => {
    expect(toHex(fromHex("#3a7bd5"))).toBe("#3A7BD5");
    expect(toHex(fromHex("#ffffff"))).toBe("#FFFFFF");
  });

  it("maps colors outside sRGB into it", () => {
    expect(toHex([0.7, MAX_CHROMA, 150])).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("getGamut", () => {
  it("keeps sRGB primaries inside sRGB after rounding", () => {
    expect(getGamut(fromHex("#ff0000"))).toBe("srgb");
  });

  it("tells P3 colors apart from colors outside P3", () => {
    expect(getGamut([0.65, 0.25, 145])).toBe("p3");
    expect(getGamut([0.5, 0.4, 145])).toBe("outside");
  });
});

describe("mixColors", () => {
  it("averages lightness and chroma", () => {
    expect(mixColors([0.2, 0.1, 100], [0.6, 0.3, 100])).toEqual([
      0.4, 0.2, 100,
    ]);
  });

  it("mixes hues the short way around the wheel", () => {
    expect(mixColors([0.5, 0.1, 350], [0.5, 0.1, 10])[2]).toBe(0);
    expect(mixColors([0.5, 0.1, 10], [0.5, 0.1, 350])[2]).toBe(0);
  });
});

describe("generateColors", () => {
  const harmonyNames = Object.keys(harmonies) as Harmony[];

  it.each(harmonyNames)("builds a valid sRGB palette for %s", (harmony) => {
    const colors = generateColors("#2f6fde", harmony);

    expect(colors).toHaveLength(5);
    expect(isPaletteColors(colors)).toBe(true);
    expect(colors.every((generated) => getGamut(generated) === "srgb")).toBe(
      true,
    );
  });

  it("keeps the base color unchanged in the palette", () => {
    expect(generateColors("#2f6fde", "triadic")).toContainEqual(
      fromHex("#2f6fde"),
    );
  });

  it("builds a valid palette from a neutral base", () => {
    expect(isPaletteColors(generateColors("#808080", "triadic"))).toBe(true);
  });
});

describe("toCss", () => {
  it("formats an OKLCH color", () => {
    expect(toCss([0.5, 0.1, 200])).toBe("oklch(0.5 0.1 200)");
  });
});

describe("readableOn", () => {
  it("uses dark text on light colors and light text on dark colors", () => {
    expect(readableOn([0.9, 0.1, 200])).toBe("oklch(0.2 0 0)");
    expect(readableOn([0.3, 0.1, 200])).toBe("oklch(0.98 0 0)");
  });
});
