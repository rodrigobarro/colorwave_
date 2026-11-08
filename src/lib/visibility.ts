// Who can see a palette. New palettes start private; publishing is a separate,
// deliberate step. Kept as a list so a third state (such as "unlisted") can be
// added later without changing the column.
export const VISIBILITIES = ["public", "private"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export function isVisibility(value: unknown): value is Visibility {
  return VISIBILITIES.includes(value as Visibility);
}
