import {
  contrastRatio,
  hueDistance,
  toSrgbGamut,
  type Oklch,
} from "@/lib/color";
import { resolveRoles, type Scheme } from "@/lib/color-roles";

// A palette is a handful of colors; an interface needs many more, each with a
// job: surfaces, text, borders, actions, errors, charts. This derives a full
// theme from a palette, in light and dark, with readable text guaranteed. It is
// a pure function of the palette, so every palette has a theme without storing
// anything, and THEME_VERSION goes up whenever the same palette would give a
// different theme, so an exported theme can be traced back to its rules.

export const THEME_VERSION = 1;

// shadcn/ui's variables, so a theme drops into the projects most AI tools
// start from without renaming anything.
export const SHADCN_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

// What shadcn/ui leaves out: status colors besides errors, and a place for the
// palette's second color, since shadcn's "accent" is a quiet hover background.
export const EXTRA_TOKENS = [
  "highlight",
  "highlight-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
] as const;

export const THEME_TOKENS = [...SHADCN_TOKENS, ...EXTRA_TOKENS] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];

export type ThemeColors = Record<ThemeToken, Oklch>;

export type Theme = {
  version: typeof THEME_VERSION;
  // The scheme the palette reads as, shown first.
  scheme: Scheme;
  light: ThemeColors;
  dark: ThemeColors;
};

// WCAG AA for body text, AAA for the main text, and the minimum for large text
// and for shapes such as buttons, focus rings and chart marks.
export const TEXT_CONTRAST = 4.5;
export const MAIN_TEXT_CONTRAST = 7;
export const GRAPHIC_CONTRAST = 3;

// Each surface and the text meant for it, all held to TEXT_CONTRAST.
export const TEXT_PAIRS: readonly [ThemeToken, ThemeToken][] = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["background", "muted-foreground"],
  ["card", "muted-foreground"],
  ["accent", "accent-foreground"],
  ["destructive", "destructive-foreground"],
  // Form errors are written in the destructive color.
  ["background", "destructive"],
  ["sidebar", "sidebar-foreground"],
  ["sidebar-primary", "sidebar-primary-foreground"],
  ["sidebar-accent", "sidebar-accent-foreground"],
  ["highlight", "highlight-foreground"],
  ["success", "success-foreground"],
  ["warning", "warning-foreground"],
  ["info", "info-foreground"],
];

// Colors drawn straight on the background, held to GRAPHIC_CONTRAST. The
// warning color is left out: it is light by nature and always carries its own
// text.
export const GRAPHIC_TOKENS: readonly ThemeToken[] = [
  "primary",
  "ring",
  // Used for icons and words in headings, not only for badges.
  "highlight",
  "success",
  "info",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
];

const CHART_COUNT = 5;
// Below this chroma a palette color reads as a neutral, not as a chart series.
const CHART_MIN_CHROMA = 0.05;
const LIGHTNESS_STEP = 0.01;

// Status colors keep their meaning (red is an error in any palette), lean
// slightly toward the palette's main hue so they belong to it, and take its
// intensity: a muted palette gets muted alerts.
const STATUS = {
  destructive: { hue: 27, light: 0.55, dark: 0.68, onBackground: TEXT_CONTRAST },
  success: { hue: 150, light: 0.55, dark: 0.72, onBackground: GRAPHIC_CONTRAST },
  warning: { hue: 80, light: 0.8, dark: 0.82, onBackground: 0 },
  info: { hue: 245, light: 0.55, dark: 0.72, onBackground: GRAPHIC_CONTRAST },
} as const;
const HARMONIZE_SHARE = 0.15;
const HARMONIZE_MAX = 12;

type Requirement = { against: Oklch; min: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function meets(color: Oklch, requirements: readonly Requirement[]) {
  return requirements.every(
    ({ against, min }) => contrastRatio(color, against) >= min,
  );
}

// The color closest in lightness to the given one that meets every
// requirement, keeping its hue and as much chroma as sRGB allows, or null when
// no lightness does.
function fit(color: Oklch, requirements: readonly Requirement[]): Oklch | null {
  const start = toSrgbGamut(color);

  if (meets(start, requirements)) return start;

  const [lightness, chroma, hue] = color;

  for (let shift = LIGHTNESS_STEP; shift <= 1; shift += LIGHTNESS_STEP) {
    for (const next of [lightness - shift, lightness + shift]) {
      if (next < 0 || next > 1) continue;

      const candidate = toSrgbGamut([next, chroma, hue]);

      if (meets(candidate, requirements)) return candidate;
    }
  }

  return null;
}

// Like fit, for text: if nothing fits, the best available is black or white.
function fitText(color: Oklch, requirements: readonly Requirement[]): Oklch {
  return (
    fit(color, requirements) ??
    ([[0, 0, 0], [1, 0, 0]] as Oklch[]).reduce((best, candidate) =>
      contrastRatio(candidate, requirements[0].against) >
      contrastRatio(best, requirements[0].against)
        ? candidate
        : best,
    )
  );
}

type Inks = { light: Oklch; dark: Oklch };

// A filled color (a button, a badge) and the text on it. Of the light and dark
// inks, it takes the one that needs the smallest change to the color.
function solid(
  color: Oklch,
  inks: Inks,
  background: Oklch,
  onBackground: number,
): { fill: Oklch; ink: Oklch } {
  const options = [inks.light, inks.dark].flatMap((ink) => {
    const requirements = [{ against: ink, min: TEXT_CONTRAST }];

    if (onBackground > 0) {
      requirements.push({ against: background, min: onBackground });
    }

    const fill = fit(color, requirements);

    return fill ? [{ fill, ink }] : [];
  });

  const shift = ({ fill }: { fill: Oklch }) => Math.abs(fill[0] - color[0]);
  const best = options.reduce<(typeof options)[number] | undefined>(
    (current, option) =>
      !current ||
      shift(option) < shift(current) ||
      (shift(option) === shift(current) &&
        contrastRatio(option.fill, option.ink) >
          contrastRatio(current.fill, current.ink))
        ? option
        : current,
    undefined,
  );

  // Black and white text meet AA on any color, so this only happens when the
  // background requirement can't be met either.
  return best ?? { fill: toSrgbGamut(color), ink: inks.dark };
}

function harmonize(hue: number, toward: number) {
  const delta = ((toward - hue + 540) % 360) - 180;
  const shift = Math.sign(delta) * Math.min(Math.abs(delta) * HARMONIZE_SHARE, HARMONIZE_MAX);

  return (hue + shift + 360) % 360;
}

// Up to five distinct series: the palette's own colors, the main one first,
// then each next one as far in hue as possible from those already taken. A
// palette with fewer colors repeats them lighter or darker.
function chartBases(colors: readonly Oklch[], primary: Oklch): Oklch[] {
  const chromatic = colors.filter(([, chroma]) => chroma >= CHART_MIN_CHROMA);
  const bases: Oklch[] = [];

  if (chromatic.length === 0) {
    // Nothing colorful to draw from: spread hues evenly from the main color.
    const chroma = Math.max(primary[1], 0.12);

    return Array.from({ length: CHART_COUNT }, (_, index) => [
      0.62,
      chroma,
      (primary[2] + (index * 360) / CHART_COUNT) % 360,
    ]);
  }

  const remaining = [...chromatic];
  const first = remaining.findIndex((color) => color === primary);

  bases.push(remaining.splice(first >= 0 ? first : 0, 1)[0]);

  while (remaining.length > 0 && bases.length < CHART_COUNT) {
    const spread = (color: Oklch) =>
      Math.min(...bases.map((taken) => hueDistance(taken[2], color[2])));
    let best = 0;

    remaining.forEach((color, index) => {
      if (spread(color) > spread(remaining[best])) best = index;
    });
    bases.push(remaining.splice(best, 1)[0]);
  }

  return bases;
}

type Context = {
  primary: Oklch;
  highlight: Oklch;
  tintHue: number;
  tintChroma: number;
  charts: Oklch[];
};

type Ends = { background: Oklch; foreground: Oklch };

function neutral(context: Context, lightness: number, chromaScale = 1): Oklch {
  return toSrgbGamut([
    lightness,
    context.tintChroma * chromaScale,
    context.tintHue,
  ]);
}

// The background and main text, from the palette's own near-neutrals when it
// has them, and otherwise from neutrals tinted with its main hue.
function ends(colors: readonly Oklch[], context: Context, scheme: Scheme): Ends {
  const byLightness = [...colors].sort((a, b) => a[0] - b[0]);
  const darkest = byLightness[0];
  const lightest = byLightness[byLightness.length - 1];
  const isLight = scheme === "light";

  const background = isLight
    ? lightest[0] >= 0.9 && lightest[1] <= 0.06
      ? toSrgbGamut(lightest)
      : neutral(context, 0.985, 0.6)
    : darkest[0] <= 0.25 && darkest[1] <= 0.08
      ? toSrgbGamut(darkest)
      : neutral(context, 0.16);

  const textRequirement = [{ against: background, min: MAIN_TEXT_CONTRAST }];
  const ownText = isLight
    ? darkest[0] <= 0.35 && fit(darkest, textRequirement)
    : lightest[0] >= 0.85 && fit(lightest, textRequirement);
  const foreground =
    ownText ||
    fitText(isLight ? neutral(context, 0.2, 1.5) : neutral(context, 0.96, 0.6), textRequirement);

  return { background, foreground };
}

function deriveScheme(
  scheme: Scheme,
  { background, foreground }: Ends,
  inks: Inks,
  context: Context,
): ThemeColors {
  const isLight = scheme === "light";
  const [bgL, bgC, bgH] = background;
  // Surfaces step away from the background toward the text. Dark interfaces
  // need bigger steps for the same visible difference.
  const surface = (lightStep: number, darkStep: number, chroma = bgC): Oklch =>
    toSrgbGamut([
      clamp(isLight ? bgL + lightStep : bgL + darkStep, 0, 1),
      chroma,
      bgH,
    ]);
  const quietChroma = Math.max(bgC, context.tintChroma * 1.5);

  const card = surface(0.015, 0.035, isLight ? bgC * 0.5 : bgC);
  const secondary = surface(-0.04, 0.1, quietChroma);
  const muted = secondary;
  // The quiet hover color takes the palette's second hue, so even menus and
  // ghost buttons carry some of it.
  const accent = toSrgbGamut([
    secondary[0],
    clamp(context.highlight[1] * 0.3, quietChroma, 0.04),
    context.highlight[2],
  ]);
  const sidebar = surface(-0.012, 0.035);
  const border = surface(-0.085, 0.12, quietChroma);
  const input = surface(-0.085, 0.15, quietChroma);

  const textOn = (...surfaces: Oklch[]) =>
    fitText(
      foreground,
      surfaces.map((against) => ({ against, min: TEXT_CONTRAST })),
    );
  const [, fgC, fgH] = foreground;
  const mutedForeground = fitText(
    [isLight ? 0.5 : 0.72, Math.min(fgC, 0.04), fgH],
    [background, card, muted, sidebar].map((against) => ({
      against,
      min: TEXT_CONTRAST,
    })),
  );

  const primary = solid(context.primary, inks, background, GRAPHIC_CONTRAST);
  const highlight = solid(context.highlight, inks, background, GRAPHIC_CONTRAST);
  const status = Object.fromEntries(
    Object.entries(STATUS).map(([name, spec]) => [
      name,
      solid(
        [
          isLight ? spec.light : spec.dark,
          clamp(context.primary[1], 0.12, 0.2),
          harmonize(spec.hue, context.primary[2]),
        ],
        inks,
        background,
        spec.onBackground,
      ),
    ]),
  ) as Record<keyof typeof STATUS, { fill: Oklch; ink: Oklch }>;

  // Repeated series step toward the text, where there is room to stay visible.
  const charts = Array.from({ length: CHART_COUNT }, (_, index) => {
    const base = context.charts[index % context.charts.length];
    const round = Math.floor(index / context.charts.length);
    const lightness = clamp(base[0] + (isLight ? -1 : 1) * 0.14 * round, 0, 1);

    return fitText([lightness, base[1], base[2]], [
      { against: background, min: GRAPHIC_CONTRAST },
    ]);
  });

  return {
    background,
    foreground,
    card,
    "card-foreground": textOn(card),
    popover: card,
    "popover-foreground": textOn(card),
    primary: primary.fill,
    "primary-foreground": primary.ink,
    secondary,
    "secondary-foreground": textOn(secondary),
    muted,
    "muted-foreground": mutedForeground,
    accent,
    "accent-foreground": textOn(accent),
    destructive: status.destructive.fill,
    "destructive-foreground": status.destructive.ink,
    border,
    input,
    ring: primary.fill,
    "chart-1": charts[0],
    "chart-2": charts[1],
    "chart-3": charts[2],
    "chart-4": charts[3],
    "chart-5": charts[4],
    sidebar,
    "sidebar-foreground": textOn(sidebar),
    "sidebar-primary": primary.fill,
    "sidebar-primary-foreground": primary.ink,
    "sidebar-accent": accent,
    "sidebar-accent-foreground": textOn(accent),
    "sidebar-border": border,
    "sidebar-ring": primary.fill,
    highlight: highlight.fill,
    "highlight-foreground": highlight.ink,
    success: status.success.fill,
    "success-foreground": status.success.ink,
    warning: status.warning.fill,
    "warning-foreground": status.warning.ink,
    info: status.info.fill,
    "info-foreground": status.info.ink,
  };
}

export function deriveTheme(colors: readonly Oklch[]): Theme {
  const roles = resolveRoles(colors);
  const primary = roles.colors.primary;
  const context: Context = {
    primary,
    highlight: roles.colors.accent,
    // Neutrals take a hint of the main hue, more for more colorful palettes,
    // so no two themes share the same gray.
    tintHue: primary[2],
    tintChroma: clamp(primary[1] * 0.1, 0.004, 0.02),
    charts: chartBases(colors, primary),
  };

  const light = ends(colors, context, "light");
  const dark = ends(colors, context, "dark");
  // Text on filled colors is the main text of one scheme or the other, so a
  // dark-blue palette writes dark blue on its yellow buttons, not black.
  const inks: Inks = { light: dark.foreground, dark: light.foreground };

  return {
    version: THEME_VERSION,
    scheme: roles.scheme,
    light: deriveScheme("light", light, inks, context),
    dark: deriveScheme("dark", dark, inks, context),
  };
}
