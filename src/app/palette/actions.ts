"use server";

import { and, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { palettes } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { PALETTE_LIST_TAG, paletteTag } from "@/lib/cache-tags";
import {
  parsePaletteId,
  parsePaletteInput,
  type PaletteInput,
} from "@/lib/palette-input";
import { isVisibility, type Visibility } from "@/lib/visibility";

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

// Only public palettes are in the shared caches; a private one has nothing
// cached to expire, so changing it leaves the gallery's cache warm.
function expireIfPublic(id: number, visibility: Visibility) {
  if (visibility !== "public") return;

  updateTag(PALETTE_LIST_TAG);
  updateTag(paletteTag(id));
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

  const [updated] = await db
    .update(palettes)
    .set(parsed.palette)
    .where(isOwnPalette(id, userId))
    .returning({ visibility: palettes.visibility });

  if (!updated) return { error: NOT_FOUND };

  expireIfPublic(id, updated.visibility);
}

export async function deletePalette(paletteId: number) {
  const userId = await getUserId();

  if (!userId) return { error: "Sign in to delete this palette." };

  const id = parsePaletteId(paletteId);

  if (!id) return { error: NOT_FOUND };

  const [deleted] = await db
    .delete(palettes)
    .where(isOwnPalette(id, userId))
    .returning({ visibility: palettes.visibility });

  if (!deleted) return { error: NOT_FOUND };

  expireIfPublic(id, deleted.visibility);
}

export async function setPaletteVisibility(
  paletteId: number,
  visibility: Visibility,
) {
  const userId = await getUserId();

  if (!userId) return { error: "Sign in to change who sees this palette." };

  const id = parsePaletteId(paletteId);

  if (!id || !isVisibility(visibility)) return { error: NOT_FOUND };

  const updated = await db
    .update(palettes)
    .set(
      visibility === "public"
        ? // The first publication date sticks, so going private and public
          // again doesn't move the palette back to the top of the gallery.
          { visibility, publishedAt: sql`coalesce(${palettes.publishedAt}, now())` }
        : { visibility },
    )
    .where(isOwnPalette(id, userId))
    .returning({ id: palettes.id });

  if (updated.length === 0) return { error: NOT_FOUND };

  // Either way the palette enters or leaves the shared caches.
  updateTag(PALETTE_LIST_TAG);
  updateTag(paletteTag(id));
}
