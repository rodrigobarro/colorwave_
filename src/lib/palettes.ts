import { palettes } from "@/data/palettes";
import type { Oklch } from "@/lib/color";

export type Palette = {
  name: string;
  colors: readonly Oklch[];
};

const PAGE_SIZE = 12;

export const pageCount = Math.ceil(palettes.length / PAGE_SIZE);

export function getPalettePage(page: number) {
  return palettes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}
