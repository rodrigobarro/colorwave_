import { describe, expect, it } from "vitest";
import { fromHex, generateColors, isPaletteColors } from "@/lib/color";
import {
  extractPalettes,
  IMAGE_PALETTE_SIZE,
  imageStyles,
  type ImageStyle,
} from "@/lib/image-palette";

type Region = { hex: string; pixels: number; alpha?: number };

// Builds RGBA pixels with each color repeated, as an image with flat regions.
function image(...regions: Region[]) {
  const values = regions.flatMap(({ hex, pixels, alpha = 255 }) => {
    const rgba = [1, 3, 5].map((start) =>
      Number.parseInt(hex.slice(start, start + 2), 16),
    );

    return Array.from({ length: pixels }, () => [...rgba, alpha]).flat();
  });

  return new Uint8ClampedArray(values);
}

const styles = Object.keys(imageStyles) as ImageStyle[];

// Six well separated colors, with the largest areas on the duller ones.
const scene = image(
  { hex: "#1b2a3a", pixels: 400 }, // dark navy, the background
  { hex: "#d9d2c5", pixels: 300 }, // light beige
  { hex: "#7a8a70", pixels: 150 }, // muted green
  { hex: "#ff3b1f", pixels: 60 }, // vivid red
  { hex: "#ffd400", pixels: 50 }, // vivid yellow
  { hex: "#0a0a0a", pixels: 40 }, // near black
);

describe("extractPalettes", () => {
  it("gives a valid palette of the right size for every style", () => {
    const palettes = extractPalettes(scene);

    for (const style of styles) {
      expect(palettes?.[style]).toHaveLength(IMAGE_PALETTE_SIZE);
      expect(isPaletteColors(palettes?.[style])).toBe(true);
    }
  });

  it("only uses colors that exist in the image", () => {
    const inImage = [
      "#1b2a3a",
      "#d9d2c5",
      "#7a8a70",
      "#ff3b1f",
      "#ffd400",
      "#0a0a0a",
    ].map((hex) => JSON.stringify(fromHex(hex)));
    const palettes = extractPalettes(scene)!;

    for (const style of styles) {
      for (const color of palettes[style]) {
        expect(inImage).toContain(JSON.stringify(color));
      }
    }
  });

  it("orders each palette from dark to light", () => {
    const palettes = extractPalettes(scene)!;

    for (const style of styles) {
      const lightness = palettes[style].map(([value]) => value);

      expect(lightness).toEqual(lightness.toSorted((a, b) => a - b));
    }
  });

  it("leaves out the smallest color for dominant, and the dullest for vibrant", () => {
    const palettes = extractPalettes(scene)!;
    const has = (style: ImageStyle, hex: string) =>
      palettes[style].some(
        (color) => JSON.stringify(color) === JSON.stringify(fromHex(hex)),
      );

    expect(has("dominant", "#0a0a0a")).toBe(false);
    expect(has("vibrant", "#ff3b1f")).toBe(true);
    expect(has("vibrant", "#ffd400")).toBe(true);
  });

  it("gives the same palettes for the same image", () => {
    expect(extractPalettes(scene)).toEqual(extractPalettes(scene));
  });

  it("ignores transparent pixels", () => {
    const palettes = extractPalettes(
      image(
        { hex: "#ff0000", pixels: 900, alpha: 0 },
        { hex: "#2f6fde", pixels: 50 },
        { hex: "#f2c14e", pixels: 50 },
      ),
    )!;

    expect(palettes.dominant.map(([, , hue]) => hue)).not.toContain(
      fromHex("#ff0000")[2],
    );
  });

  it("turns a single-color image into that color's monochromatic ramp", () => {
    const palettes = extractPalettes(image({ hex: "#2f6fde", pixels: 100 }));

    expect(palettes?.dominant).toEqual(
      generateColors("#2f6fde", "monochromatic"),
    );
  });

  it("returns null for an image with no opaque pixels", () => {
    expect(
      extractPalettes(image({ hex: "#2f6fde", pixels: 100, alpha: 0 })),
    ).toBeNull();
    expect(extractPalettes(new Uint8ClampedArray())).toBeNull();
  });

  it("returns fewer colors when the image has fewer than a full palette", () => {
    const palettes = extractPalettes(
      image({ hex: "#2f6fde", pixels: 60 }, { hex: "#f2c14e", pixels: 40 }),
    );

    expect(palettes?.dominant).toHaveLength(2);
  });
});
