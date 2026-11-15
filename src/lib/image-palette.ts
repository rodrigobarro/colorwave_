import { fromHex, generateColors, MIN_COLORS, type Oklch } from "@/lib/color";

export type ImageStyle = "dominant" | "vibrant" | "soft" | "dark";

type Cluster = {
  // Mean of the cluster in OKLab.
  lab: readonly [number, number, number];
  // Share of the image's opaque pixels, from 0 to 1.
  share: number;
  // The real pixel closest to the mean, so every color exists in the image.
  hex: string;
};

const chromaOf = ({ lab: [, a, b] }: Cluster) => Math.hypot(a, b);

// Specks smaller than this are noise, not colors anyone sees in the image.
const MIN_SHARE = 0.005;

export const imageStyles: Record<
  ImageStyle,
  { label: string; score: (cluster: Cluster) => number }
> = {
  dominant: { label: "Dominant", score: ({ share }) => share },
  vibrant: {
    label: "Vibrant",
    score: (cluster) => chromaOf(cluster) ** 2 * Math.sqrt(cluster.share),
  },
  soft: {
    label: "Soft",
    score: (cluster) =>
      (Math.sqrt(cluster.share) * cluster.lab[0] ** 2) /
      (1 + 8 * chromaOf(cluster)),
  },
  dark: {
    label: "Dark",
    score: (cluster) => Math.sqrt(cluster.share) * (1 - cluster.lab[0]) ** 2,
  },
};

export const IMAGE_PALETTE_SIZE = 5;

const CLUSTER_COUNT = 12;
const MAX_ITERATIONS = 20;
// Pixels this transparent are background, not part of the image.
const MIN_ALPHA = 128;
// OKLab distances: picks closer than this read as the same color, so a style
// first tries spaced-out colors and only then accepts closer ones.
const SPACING_STEPS = [0.08, 0.04, 0];

const LINEAR = Array.from({ length: 256 }, (_, value) => {
  const channel = value / 255;

  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
});

// sRGB to OKLab, from Björn Ottosson's reference. Done by hand because
// colorjs.io is far too slow to call once per pixel.
function toLab(red: number, green: number, blue: number) {
  const r = LINEAR[red];
  const g = LINEAR[green];
  const b = LINEAR[blue];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ] as const;
}

function toHexString(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

// A fixed seed makes the same image always give the same palette.
function seededRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function distanceSquared(
  points: Float64Array,
  index: number,
  center: readonly number[],
) {
  const dl = points[index * 3] - center[0];
  const da = points[index * 3 + 1] - center[1];
  const db = points[index * 3 + 2] - center[2];

  return dl * dl + da * da + db * db;
}

// k-means++: each new center is drawn with a chance proportional to its squared
// distance from the closest center so far, which spreads them over the image.
function initialCenters(points: Float64Array, count: number) {
  const random = seededRandom(1);
  const size = points.length / 3;
  const pointAt = (index: number) => [
    points[index * 3],
    points[index * 3 + 1],
    points[index * 3 + 2],
  ];
  const centers = [pointAt(Math.floor(random() * size))];
  const closest = new Float64Array(size).fill(Infinity);

  while (centers.length < count) {
    const latest = centers[centers.length - 1];
    let total = 0;

    for (let index = 0; index < size; index++) {
      closest[index] = Math.min(
        closest[index],
        distanceSquared(points, index, latest),
      );
      total += closest[index];
    }

    // Every pixel already sits on a center: the image has no more colors.
    if (total === 0) break;

    let target = random() * total;
    let picked = size - 1;

    for (let index = 0; index < size; index++) {
      target -= closest[index];
      if (target <= 0) {
        picked = index;
        break;
      }
    }

    centers.push(pointAt(picked));
  }

  return centers;
}

function cluster(pixels: Uint8ClampedArray): Cluster[] {
  const opaque: number[] = [];

  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] >= MIN_ALPHA) opaque.push(offset);
  }

  const size = opaque.length;
  const points = new Float64Array(size * 3);

  opaque.forEach((offset, index) => {
    points.set(
      toLab(pixels[offset], pixels[offset + 1], pixels[offset + 2]),
      index * 3,
    );
  });

  if (size === 0) return [];

  const centers = initialCenters(points, Math.min(CLUSTER_COUNT, size));
  const assignment = new Int32Array(size).fill(-1);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let changed = false;

    for (let index = 0; index < size; index++) {
      let best = 0;
      let bestDistance = Infinity;

      centers.forEach((center, centerIndex) => {
        const distance = distanceSquared(points, index, center);

        if (distance < bestDistance) {
          best = centerIndex;
          bestDistance = distance;
        }
      });

      if (assignment[index] !== best) {
        assignment[index] = best;
        changed = true;
      }
    }

    if (!changed) break;

    const sums = centers.map(() => [0, 0, 0, 0]);

    for (let index = 0; index < size; index++) {
      const sum = sums[assignment[index]];

      sum[0] += points[index * 3];
      sum[1] += points[index * 3 + 1];
      sum[2] += points[index * 3 + 2];
      sum[3] += 1;
    }

    sums.forEach(([l, a, b, count], centerIndex) => {
      if (count > 0) centers[centerIndex] = [l / count, a / count, b / count];
    });
  }

  const counts = centers.map(() => 0);
  const nearest = centers.map(() => ({ index: -1, distance: Infinity }));

  for (let index = 0; index < size; index++) {
    const centerIndex = assignment[index];
    const distance = distanceSquared(points, index, centers[centerIndex]);

    counts[centerIndex] += 1;
    if (distance < nearest[centerIndex].distance) {
      nearest[centerIndex] = { index, distance };
    }
  }

  return centers.flatMap((center, centerIndex): Cluster[] => {
    if (counts[centerIndex] === 0) return [];

    const offset = opaque[nearest[centerIndex].index];

    return [
      {
        lab: [center[0], center[1], center[2]],
        share: counts[centerIndex] / size,
        hex: toHexString(pixels[offset], pixels[offset + 1], pixels[offset + 2]),
      },
    ];
  });
}

function distance(a: Cluster, b: Cluster) {
  return Math.hypot(a.lab[0] - b.lab[0], a.lab[1] - b.lab[1], a.lab[2] - b.lab[2]);
}

function pick(clusters: readonly Cluster[], style: ImageStyle) {
  const { score } = imageStyles[style];
  const candidates = clusters
    .filter((cluster) => style === "dominant" || cluster.share >= MIN_SHARE)
    .toSorted((a, b) => score(b) - score(a));
  const picked: Cluster[] = [];

  for (const spacing of SPACING_STEPS) {
    for (const candidate of candidates) {
      if (picked.length === IMAGE_PALETTE_SIZE) break;
      if (picked.includes(candidate)) continue;
      if (picked.every((other) => distance(other, candidate) >= spacing)) {
        picked.push(candidate);
      }
    }
  }

  return picked
    .toSorted((a, b) => a.lab[0] - b.lab[0])
    .map(({ hex }) => fromHex(hex));
}

export type ImagePalettes = Record<ImageStyle, readonly Oklch[]>;

// Takes RGBA pixels, as canvas getImageData returns them, and gives one palette
// per style, darkest color first like the harmonies. Returns null when the
// image has no opaque pixels.
export function extractPalettes(
  pixels: Uint8ClampedArray,
): ImagePalettes | null {
  const clusters = cluster(pixels);

  if (clusters.length === 0) return null;

  // A flat image has a single color, too few for a palette, so it gets the
  // monochromatic ramp of that color instead.
  if (clusters.length < MIN_COLORS) {
    const colors = generateColors(clusters[0].hex, "monochromatic");

    return { dominant: colors, vibrant: colors, soft: colors, dark: colors };
  }

  return {
    dominant: pick(clusters, "dominant"),
    vibrant: pick(clusters, "vibrant"),
    soft: pick(clusters, "soft"),
    dark: pick(clusters, "dark"),
  };
}

export function isImageStyle(value: unknown): value is ImageStyle {
  return typeof value === "string" && Object.hasOwn(imageStyles, value);
}
