import { palettes } from "@/data/palettes";

export type Oklch = readonly [lightness: number, chroma: number, hue: number];

export type Palette = {
  name: string;
  colors: readonly Oklch[];
};

const PAGE_SIZE = 12;

export const pageCount = Math.ceil(palettes.length / PAGE_SIZE);

export function getPalettePage(page: number) {
  return palettes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export function toCss([lightness, chroma, hue]: Oklch) {
  return `oklch(${lightness} ${chroma} ${hue})`;
}
