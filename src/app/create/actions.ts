"use server";

import { and, count, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { palettes } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { parsePaletteInput, type PaletteInput } from "@/lib/palette-input";

const SAVE_LIMIT_PER_HOUR = 10;

// Saves a new palette to the author's account. It starts private, so nothing
// shared changes and no cache needs to expire; publishing is a separate step.
export async function savePalette(input: PaletteInput) {
  const { data: session } = await auth.getSession();

  if (!session?.user) return { error: "Sign in to save the palette." };

  const parsed = parsePaletteInput(input);

  if (!parsed.ok) {
    return {
      error:
        parsed.problem === "name"
          ? "Give the palette a name before saving."
          : "This palette has invalid colors.",
    };
  }

  // Uses the database clock so the window doesn't depend on the server's.
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(palettes)
    .where(
      and(
        eq(palettes.authorId, session.user.id),
        gt(palettes.createdAt, sql`now() - interval '1 hour'`),
      ),
    );

  if (recent >= SAVE_LIMIT_PER_HOUR) {
    return {
      error: "You saved too many palettes in the last hour. Try again later.",
    };
  }

  const [{ id }] = await db
    .insert(palettes)
    .values({ ...parsed.palette, authorId: session.user.id, visibility: "private" })
    .returning({ id: palettes.id });

  return { id };
}
