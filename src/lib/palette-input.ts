import { isHarmony, isHexColor, isPaletteColors } from "@/lib/color";
import { MAX_NAME_LENGTH, type Draft } from "@/lib/draft";

export type PaletteInput = Pick<Draft, "name" | "base" | "harmony" | "colors">;

// Postgres `integer`; a larger id fails the query instead of matching nothing.
const MAX_PALETTE_ID = 2_147_483_647;

// Server actions receive whatever the client sends, so every field is checked.
export function parsePaletteInput(
  input: PaletteInput,
):
  | { ok: true; palette: PaletteInput }
  | { ok: false; problem: "name" | "colors" } {
  const name = typeof input?.name === "string" ? input.name.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) {
    return { ok: false, problem: "name" };
  }

  const { base, harmony, colors } = input;

  if (!isPaletteColors(colors) || !isHexColor(base) || !isHarmony(harmony)) {
    return { ok: false, problem: "colors" };
  }

  return {
    ok: true,
    palette: { name, base: base.toLowerCase(), harmony, colors },
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
