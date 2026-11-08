import type { Oklch } from "@/lib/color";

// A palette is an ordered list of colors with no meaning attached, while a
// preview of an interface needs roles: a background, text, a main color. This
// picks a color for each role, so a preview asks for "primary" and works with
// any palette, whatever its size or order.

export const ROLES = ["bg", "surface", "fg", "muted", "primary", "accent"] as const;

export type Role = (typeof ROLES)[number];

export type Scheme = "light" | "dark";

export type ResolvedRoles = {
  scheme: Scheme;
  colors: Record<Role, Oklch>;
  // The palette color each role came from, or null when the role was derived
  // because the palette has no color that fits it (a neutral background, say).
  source: Record<Role, number | null>;
};

// Backgrounds and body text need near-neutral colors at the ends of the
// lightness range; below these chroma limits a palette color is used as is.
const NEUTRAL_BG_CHROMA = 0.06;
const NEUTRAL_DARK_BG_CHROMA = 0.08;
// A main color this close in lightness to the background barely shows on it.
const MIN_LIGHTNESS_GAP = 0.25;
// Among equally saturated colors, a mid lightness reads best as a main color.
const PREFERRED_PRIMARY_LIGHTNESS = 0.55;

type Pick = { color: Oklch; source: number | null };

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function hueDistance(a: number, b: number) {
  const distance = Math.abs(a - b) % 360;

  return distance > 180 ? 360 - distance : distance;
}

function indexBy(
  indices: number[],
  score: (index: number) => number,
): number | undefined {
  let best: number | undefined;

  for (const index of indices) {
    if (best === undefined || score(index) > score(best)) best = index;
  }

  return best;
}

export function resolveRoles(colors: readonly Oklch[]): ResolvedRoles {
  const indices = colors.map((_, index) => index);
  const lightness = (index: number) => colors[index][0];
  const chroma = (index: number) => colors[index][1];
  const hue = (index: number) => colors[index][2];

  // Mostly dark palettes read as dark interfaces, the rest as light ones.
  const scheme: Scheme = median(colors.map(([l]) => l)) < 0.5 ? "dark" : "light";
  const isLight = scheme === "light";

  const lightest = indexBy(indices, lightness)!;
  const darkest = indexBy(indices, (index) => -lightness(index))!;
  const mostSaturated = indexBy(indices, chroma)!;
  // Derived neutrals take a hint of the palette's strongest hue.
  const tintHue = hue(mostSaturated);
  const tint = (l: number, maxChroma: number): Oklch => [
    l,
    Math.min(maxChroma, chroma(mostSaturated)),
    tintHue,
  ];

  const bg: Pick = isLight
    ? lightness(lightest) >= 0.9 && chroma(lightest) <= NEUTRAL_BG_CHROMA
      ? { color: colors[lightest], source: lightest }
      : { color: tint(0.985, 0.012), source: null }
    : lightness(darkest) <= 0.25 && chroma(darkest) <= NEUTRAL_DARK_BG_CHROMA
      ? { color: colors[darkest], source: darkest }
      : { color: tint(0.17, 0.02), source: null };

  const fg: Pick = isLight
    ? lightness(darkest) <= 0.35
      ? { color: colors[darkest], source: darkest }
      : { color: tint(0.22, 0.03), source: null }
    : lightness(lightest) >= 0.85
      ? { color: colors[lightest], source: lightest }
      : { color: tint(0.95, 0.012), source: null };

  // The main colors come from what is left once the background and text took
  // theirs, and must stand out from the background.
  const unused = indices.filter((i) => i !== bg.source && i !== fg.source);
  const pool = unused.length > 0 ? unused : indices.filter((i) => i !== bg.source);
  const visible = pool.filter(
    (i) => Math.abs(lightness(i) - bg.color[0]) >= MIN_LIGHTNESS_GAP,
  );
  const candidates = visible.length > 0 ? visible : pool;

  const primary = indexBy(
    candidates,
    (i) =>
      chroma(i) * 10 - Math.abs(lightness(i) - PREFERRED_PRIMARY_LIGHTNESS),
  )!;

  // The accent is the saturated color whose hue sits furthest from the main one.
  const others = candidates.filter((i) => i !== primary);
  const accent =
    indexBy(
      others,
      (i) => chroma(i) * (0.5 + hueDistance(hue(i), hue(primary)) / 180),
    ) ?? primary;

  const [bgL, bgC, bgH] = bg.color;
  const surface: Oklch = [
    Number((isLight ? bgL - 0.035 : bgL + 0.05).toFixed(4)),
    bgC,
    bgH,
  ];
  const muted: Oklch = [
    isLight ? 0.5 : 0.72,
    Math.min(fg.color[1], 0.03),
    fg.color[2],
  ];

  return {
    scheme,
    colors: {
      bg: bg.color,
      surface,
      fg: fg.color,
      muted,
      primary: colors[primary],
      accent: colors[accent],
    },
    source: {
      bg: bg.source,
      surface: null,
      fg: fg.source,
      muted: null,
      primary,
      accent,
    },
  };
}
