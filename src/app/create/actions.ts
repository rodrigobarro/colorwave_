"use server";

import { and, count, eq, gt, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { palettes } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { parsePaletteInput, type PaletteInput } from "@/lib/palette-input";

const PUBLISH_LIMIT_PER_HOUR = 10;

export async function publishPalette(input: PaletteInput) {
  const { data: session } = await auth.getSession();

  if (!session?.user) return { error: "Entre para publicar a paleta." };

  const parsed = parsePaletteInput(input);

  if (!parsed.ok) {
    return {
      error:
        parsed.problem === "name"
          ? "Dê um nome à paleta antes de publicar."
          : "Esta paleta tem cores inválidas.",
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

  if (recent >= PUBLISH_LIMIT_PER_HOUR) {
    return {
      error: "Você publicou muitas paletas na última hora. Tente mais tarde.",
    };
  }

  const [{ id }] = await db
    .insert(palettes)
    .values({ ...parsed.palette, authorId: session.user.id })
    .returning({ id: palettes.id });

  updateTag("palettes");

  return { id };
}
