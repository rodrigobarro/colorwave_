import { cacheLife, cacheTag } from "next/cache";
import { PALETTE_LIST_TAG, paletteTag } from "@/lib/cache-tags";
import {
  authorQueries,
  PAGE_SIZE,
  publicQueries,
} from "@/lib/palette-queries";

const PRERENDERED_PALETTES = 100;

export async function getPageCount() {
  "use cache";
  cacheLife("max");
  cacheTag(PALETTE_LIST_TAG);

  const [{ total }] = await publicQueries.count();

  return Math.ceil(total / PAGE_SIZE);
}

export async function getPalettePage(page: number) {
  "use cache";
  cacheLife("max");
  cacheTag(PALETTE_LIST_TAG);

  return publicQueries.page(page);
}

// The newest palettes are prerendered at build; the rest render on first visit.
export async function getPrerenderedPaletteIds() {
  "use cache";
  cacheLife("max");
  cacheTag(PALETTE_LIST_TAG);

  const rows = await publicQueries.newestIds(PRERENDERED_PALETTES);

  return rows.map(({ id }) => id);
}

// Cached and shared by every visitor, so it only ever returns public palettes.
// A private one reads as missing here; its author loads it with getOwnPalette.
export async function getPalette(id: number) {
  "use cache";
  cacheLife("max");
  cacheTag(paletteTag(id));

  const [palette] = await publicQueries.palette(id);

  return palette ?? null;
}

// Not cached: only the author sees these, and they must reflect their edits.
export function getPalettesByAuthor(authorId: string) {
  return authorQueries.list(authorId);
}

export async function getOwnPalette(id: number, authorId: string) {
  const [palette] = await authorQueries.palette(id, authorId);

  return palette ?? null;
}

export type PaletteSummary = Awaited<
  ReturnType<typeof getPalettesByAuthor>
>[number];

export type Palette = NonNullable<Awaited<ReturnType<typeof getOwnPalette>>>;
