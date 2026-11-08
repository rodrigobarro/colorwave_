// The gallery lists (pages, page count, prerendered ids) share one tag, and
// each palette has its own. Publishing or editing one palette then expires the
// lists and that palette, instead of every palette page on the site.
export const PALETTE_LIST_TAG = "palettes";

export function paletteTag(id: number) {
  return `palette:${id}`;
}
