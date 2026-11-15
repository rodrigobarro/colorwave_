import {
  isHarmony,
  isHexColor,
  isPaletteColors,
  type Harmony,
  type Oklch,
} from "@/lib/color";
import { MAX_NAME_LENGTH, type Draft, type PaletteSource } from "@/lib/draft";

// A palette made from an image has no base color or harmony to store.
export type PaletteInput = { name: string; colors: readonly Oklch[] } & (
  | { source: "harmony"; base: string; harmony: Harmony }
  | { source: "image" }
);

// The columns a palette's input is stored in.
export type StoredPaletteInput = {
  name: string;
  colors: readonly Oklch[];
  source: PaletteSource;
  base: string | null;
  harmony: Harmony | null;
};

// Postgres `integer`; a larger id fails the query instead of matching nothing.
const MAX_PALETTE_ID = 2_147_483_647;

export function toPaletteInput({
  name,
  colors,
  source,
  base,
  harmony,
}: Draft): PaletteInput {
  return source === "image"
    ? { name, colors, source }
    : { name, colors, source, base, harmony };
}

// Server actions receive whatever the client sends, so every field is checked.
export function parsePaletteInput(
  input: PaletteInput,
):
  | { ok: true; palette: StoredPaletteInput }
  | { ok: false; problem: "name" | "colors" } {
  const name = typeof input?.name === "string" ? input.name.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) {
    return { ok: false, problem: "name" };
  }

  const { colors } = input;

  if (!isPaletteColors(colors)) return { ok: false, problem: "colors" };

  if (input.source === "image") {
    return {
      ok: true,
      palette: { name, colors, source: "image", base: null, harmony: null },
    };
  }

  // A tab opened before images existed sends no source; its palette came from
  // a harmony. Typed as unknown because the client can send anything.
  const { base, harmony } = input;
  const source: unknown = input.source;

  if (
    (source !== "harmony" && source !== undefined) ||
    !isHexColor(base) ||
    !isHarmony(harmony)
  ) {
    return { ok: false, problem: "colors" };
  }

  return {
    ok: true,
    palette: {
      name,
      colors,
      source: "harmony",
      base: base.toLowerCase(),
      harmony,
    },
  };
}

export function parsePaletteId(value: unknown) {
  const id =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;

  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id < 1 ||
    id > MAX_PALETTE_ID
  ) {
    return null;
  }

  return id;
}
