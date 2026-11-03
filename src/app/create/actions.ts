"use server";

import { and, count, eq, gt, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { palettes } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { isPaletteColors } from "@/lib/color";
import { MAX_NAME_LENGTH, type Draft } from "@/lib/draft";

const PUBLISH_LIMIT_PER_HOUR = 10;

export async function publishPalette({
  name,
  colors,
}: Pick<Draft, "name" | "colors">) {
  const { data: session } = await auth.getSession();

  if (!session?.user) return { error: "Entre para publicar a paleta." };

  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
    return { error: "Dê um nome à paleta antes de publicar." };
  }

  if (!isPaletteColors(colors)) {
    return { error: "Esta paleta tem cores inválidas." };
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

  await db
    .insert(palettes)
    .values({ name: trimmedName, colors, authorId: session.user.id });

  updateTag("palettes");
}
