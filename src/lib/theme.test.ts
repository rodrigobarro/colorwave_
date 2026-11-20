import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blendOver,
  contrastRatio,
  generateColors,
  getGamut,
  harmonies,
  hueDistance,
  type Harmony,
  type Oklch,
} from "@/lib/color";
import {
  deriveTheme,
  GRAPHIC_CONTRAST,
  GRAPHIC_TOKENS,
  MAIN_TEXT_CONTRAST,
  SOFT_TINT,
  TEXT_COLOR_TOKENS,
  TEXT_CONTRAST,
  TEXT_PAIRS,
  THEME_TOKENS,
  type Theme,
} from "@/lib/theme";

// The 48 palettes the gallery started with, read from their migration.
function seedPalettes(): Oklch[][] {
  const sql = readFileSync(
    join(process.cwd(), "drizzle/0001_seed_palettes.sql"),
    "utf8",
  );

  return [...sql.matchAll(/'(\[\[.*?\]\])'::jsonb/g)].map(
    ([, json]) => JSON.parse(json) as Oklch[],
  );
}

function generatedPalettes(): Oklch[][] {
  const palettes: Oklch[][] = [];

  for (const hex of ["#3366ff", "#ff3355", "#ffd400", "#22aa66", "#7a7a7a", "#111122"]) {
    for (const harmony of Object.keys(harmonies) as Harmony[]) {
      palettes.push(generateColors(hex, harmony));
    }
  }

  return palettes;
}

// A fixed seed, so a failure always reproduces.
function randomPalettes(count: number): Oklch[][] {
  let state = 42;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };

  return Array.from({ length: count }, () =>
    Array.from({ length: 2 + Math.floor(random() * 6) }, (): Oklch => [
      Number(random().toFixed(3)),
      Number((random() * 0.3).toFixed(3)),
      Number((random() * 360).toFixed(1)),
    ]),
  );
}

const palettes = [...seedPalettes(), ...generatedPalettes(), ...randomPalettes(60)];
// Derived once: each theme takes a few milliseconds.
const themes = palettes.map((colors) => ({ colors, theme: deriveTheme(colors) }));

function schemes(theme: Theme) {
  return [theme.light, theme.dark];
}

describe("deriveTheme", () => {
  it("reads every seed palette", () => {
    expect(seedPalettes()).toHaveLength(48);
  });

  it("gives every token a color inside sRGB, in both schemes", () => {
    for (const { theme } of themes) {
      for (const scheme of schemes(theme)) {
        for (const token of THEME_TOKENS) {
          expect(scheme[token], token).toHaveLength(3);
          expect(getGamut(scheme[token]), token).toBe("srgb");
        }
      }
    }
  });

  it("keeps text readable on the surface meant for it", () => {
    for (const { colors, theme } of themes) {
      for (const [name, scheme] of Object.entries({ light: theme.light, dark: theme.dark })) {
        expect(
          contrastRatio(scheme.background, scheme.foreground),
          `${name} main text in ${JSON.stringify(colors)}`,
        ).toBeGreaterThanOrEqual(MAIN_TEXT_CONTRAST);

        for (const [surface, text] of TEXT_PAIRS) {
          expect(
            contrastRatio(scheme[surface], scheme[text]),
            `${name} ${text} on ${surface} in ${JSON.stringify(colors)}`,
          ).toBeGreaterThanOrEqual(TEXT_CONTRAST);
        }
      }
    }
  });

  it("keeps text colors readable on a soft tint of themselves", () => {
    for (const { colors, theme } of themes) {
      for (const scheme of schemes(theme)) {
        for (const token of TEXT_COLOR_TOKENS) {
          for (const surface of [scheme.background, scheme.card]) {
            const tint = blendOver(scheme[token], surface, SOFT_TINT);

            expect(
              contrastRatio(scheme[token], tint),
              `${token} on its tint in ${JSON.stringify(colors)}`,
            ).toBeGreaterThanOrEqual(TEXT_CONTRAST);
          }
        }
      }
    }
  });

  it("keeps buttons, focus rings and chart marks visible on the background", () => {
    for (const { colors, theme } of themes) {
      for (const scheme of schemes(theme)) {
        for (const token of GRAPHIC_TOKENS) {
          expect(
            contrastRatio(scheme.background, scheme[token]),
            `${token} in ${JSON.stringify(colors)}`,
          ).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
        }
      }
    }
  });

  it("is light or dark like the palette", () => {
    expect(deriveTheme([[0.97, 0.01, 90], [0.55, 0.2, 260], [0.2, 0.02, 260]]).scheme).toBe("light");
    expect(deriveTheme([[0.15, 0.02, 280], [0.3, 0.1, 280], [0.9, 0.03, 80]]).scheme).toBe("dark");
  });

  it("uses the palette's own background, text and main color when they work", () => {
    const cream: Oklch = [0.96, 0.02, 85];
    const navy: Oklch = [0.25, 0.06, 260];
    const blue: Oklch = [0.45, 0.18, 260];
    const { light } = deriveTheme([cream, blue, navy]);

    expect(light.background).toEqual(cream);
    expect(light.foreground).toEqual(navy);
    expect(light.primary).toEqual(blue);
  });

  it("tints the neutrals it derives with the main hue", () => {
    const { light, dark } = deriveTheme([[0.6, 0.2, 140], [0.7, 0.15, 30]]);

    for (const color of [light.background, light.border, dark.background]) {
      expect(color[1]).toBeGreaterThan(0.003);
      expect(hueDistance(color[2], 140)).toBeLessThan(5);
    }
  });

  it("gives a palette with no color a monochrome main color, not a gray", () => {
    const grays: Oklch[] = [0.15, 0.28, 0.42, 0.62, 0.85].map((l): Oklch => [l, 0.005, 270]);
    const { light, dark } = deriveTheme(grays);

    expect(light.primary).toEqual(light.foreground);
    expect(light["primary-foreground"]).toEqual(light.background);
    expect(dark.primary).toEqual(dark.foreground);
    expect(dark["primary-foreground"]).toEqual(dark.background);
  });

  it("keeps status colors recognizable", () => {
    for (const { theme: { light } } of themes) {
      // Up to 12° toward the main hue, plus a few from fitting into sRGB.
      expect(hueDistance(light.destructive[2], 27)).toBeLessThanOrEqual(20);
      expect(hueDistance(light.success[2], 150)).toBeLessThanOrEqual(20);
      expect(hueDistance(light.info[2], 245)).toBeLessThanOrEqual(20);
    }
  });

  it("draws chart series from the palette, main color first", () => {
    const blue: Oklch = [0.55, 0.2, 260];
    const orange: Oklch = [0.7, 0.17, 50];
    const teal: Oklch = [0.6, 0.12, 200];
    const { light } = deriveTheme([[0.97, 0.01, 90], teal, blue, orange]);

    const hues = (["chart-1", "chart-2", "chart-3"] as const).map((token) => light[token][2]);

    // Orange is the furthest hue from blue, so it comes before teal. Each may
    // be darkened to stand out on the background, but keeps its hue.
    expect(light["chart-1"]).toEqual(blue);
    [blue, orange, teal].forEach(([, , hue], index) =>
      expect(hueDistance(hues[index], hue)).toBeLessThan(3),
    );
  });

  it("is the same theme every time", () => {
    const colors = generateColors("#3366ff", "triadic");

    expect(deriveTheme(colors)).toEqual(deriveTheme(colors));
  });
});
