"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { palettes } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import {
  parsePaletteId,
  parsePaletteInput,
  type PaletteInput,
} from "@/lib/palette-input";

// Also covers palettes that belong to someone else, so the reply doesn't
// reveal which ids exist.
const NOT_FOUND = "This palette doesn't exist or isn't yours.";

async function getUserId() {
  const { data: session } = await auth.getSession();

  return session?.user.id ?? null;
}

function isOwnPalette(id: number, userId: string) {
  return and(eq(palettes.id, id), eq(palettes.authorId, userId));
}

export async function updatePalette(paletteId: number, input: PaletteInput) {
  const userId = await getUserId();

  if (!userId) return { error: "Sign in to edit this palette." };

  const id = parsePaletteId(paletteId);

  if (!id) return { error: NOT_FOUND };

  const parsed = parsePaletteInput(input);

  if (!parsed.ok) {
    return {
      error:
        parsed.problem === "name"
          ? "Give the palette a name before saving."
          : "This palette has invalid colors.",
    };
  }

  const updated = await db
    .update(palettes)
    .set(parsed.palette)
    .where(isOwnPalette(id, userId))
    .returning({ id: palettes.id });

  if (updated.length === 0) return { error: NOT_FOUND };

  updateTag("palettes");
}

export async function deletePalette(paletteId: number) {
  const userId = await getUserId();

  if (!userId) return { error: "Sign in to delete this palette." };

  const id = parsePaletteId(paletteId);

  if (!id) return { error: NOT_FOUND };

  const deleted = await db
    .delete(palettes)
    .where(isOwnPalette(id, userId))
    .returning({ id: palettes.id });

  if (deleted.length === 0) return { error: NOT_FOUND };

  updateTag("palettes");
}
