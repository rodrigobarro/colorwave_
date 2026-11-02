import {
  ColorSpace,
  inGamut,
  OKLCH,
  P3,
  parse,
  sRGB,
  to,
  toGamut,
} from "colorjs.io/fn";

ColorSpace.register(OKLCH);
ColorSpace.register(sRGB);
ColorSpace.register(P3);

export type Oklch = readonly [lightness: number, chroma: number, hue: number];

export type Gamut = "srgb" | "p3" | "outside";

export type Harmony =
  | "analogous"
  | "monochromatic"
  | "complementary"
  | "triadic";

export const harmonies: Record<
  Harmony,
  { label: string; hueOffset: (distance: number) => number }
> = {
  analogous: { label: "Análoga", hueOffset: (distance) => distance * 20 },
  monochromatic: { label: "Monocromática", hueOffset: () => 0 },
  complementary: {
    label: "Complementar",
    hueOffset: (distance) => (Math.abs(distance) % 2) * 180,
  },
  triadic: {
    label: "Triádica",
    hueOffset: (distance) => (Math.abs(distance) % 3) * 120,
  },
};

const LIGHTNESS_RAMP = [0.28, 0.44, 0.6, 0.76, 0.92];

// Rounding nudges colors on the gamut edge just outside of it, so colors within
// one 8-bit channel step still count as inside.
const GAMUT_EPSILON = 1 / 255;

// Fewer decimals push colors like #ff0000 far enough to fail the gamut check.
function roundColor([lightness, chroma, hue]: Oklch): Oklch {
  return [
    Number(lightness.toFixed(4)),
    Number(chroma.toFixed(4)),
    Number(hue.toFixed(2)),
  ];
}

function toColor(color: Oklch) {
  return {
    space: OKLCH,
    coords: [...color] as [number, number, number],
    alpha: 1,
  };
}

function fromColor(color: Parameters<typeof to>[0]): Oklch {
  const [lightness, chroma, hue] = to(color, OKLCH).coords;

  // Neutral colors have no hue, and colorjs.io reports it as null.
  return roundColor([lightness ?? 0, chroma ?? 0, hue ?? 0]);
}

export function toCss([lightness, chroma, hue]: Oklch) {
  return `oklch(${lightness} ${chroma} ${hue})`;
}

export function fromHex(hex: string) {
  return fromColor(parse(hex));
}

export function getGamut(color: Oklch): Gamut {
  const options = { epsilon: GAMUT_EPSILON };

  if (inGamut(toColor(color), sRGB, options)) return "srgb";
  return inGamut(toColor(color), P3, options) ? "p3" : "outside";
}

export function toSrgbGamut(color: Oklch) {
  return fromColor(toGamut(toColor(color), { space: sRGB, method: "css" }));
}

export function readableOn([lightness]: Oklch) {
  return lightness > 0.65 ? "oklch(0.2 0 0)" : "oklch(0.98 0 0)";
}

export function mixColors(a: Oklch, b: Oklch): Oklch {
  const hueDelta = ((b[2] - a[2] + 540) % 360) - 180;

  return roundColor([
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + hueDelta / 2 + 360) % 360,
  ]);
}

export function generateColors(baseHex: string, harmony: Harmony) {
  const base = fromHex(baseHex);
  const [lightness, chroma, hue] = base;
  const distances = LIGHTNESS_RAMP.map((step) => Math.abs(step - lightness));
  const baseIndex = distances.indexOf(Math.min(...distances));

  return LIGHTNESS_RAMP.map((step, index) => {
    if (index === baseIndex) return base;

    const offset = harmonies[harmony].hueOffset(index - baseIndex);

    return toSrgbGamut([step, chroma, (hue + offset + 360) % 360]);
  });
}
