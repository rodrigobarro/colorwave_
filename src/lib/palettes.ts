import { count, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { authUsers } from "@/db/auth-schema";
import { palettes } from "@/db/schema";

const PAGE_SIZE = 12;
const PRERENDERED_PALETTES = 100;

export async function getPageCount() {
  "use cache";
  cacheLife("max");
  cacheTag("palettes");

  const [{ total }] = await db.select({ total: count() }).from(palettes);

  return Math.ceil(total / PAGE_SIZE);
}

export async function getPalettePage(page: number) {
  "use cache";
  cacheLife("max");
  cacheTag("palettes");

  return db
    .select({
      id: palettes.id,
      name: palettes.name,
      colors: palettes.colors,
    })
    .from(palettes)
    .orderBy(desc(palettes.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

// The newest palettes are prerendered at build; the rest render on first visit.
export async function getPrerenderedPaletteIds() {
  "use cache";
  cacheLife("max");
  cacheTag("palettes");

  const rows = await db
    .select({ id: palettes.id })
    .from(palettes)
    .orderBy(desc(palettes.id))
    .limit(PRERENDERED_PALETTES);

  return rows.map(({ id }) => id);
}

export async function getPalette(id: number) {
  "use cache";
  cacheLife("max");
  cacheTag("palettes");

  const [palette] = await db
    .select({
      id: palettes.id,
      name: palettes.name,
      colors: palettes.colors,
      base: palettes.base,
      harmony: palettes.harmony,
      authorId: palettes.authorId,
      authorName: authUsers.name,
      createdAt: palettes.createdAt,
    })
    .from(palettes)
    .leftJoin(authUsers, eq(palettes.authorId, authUsers.id))
    .where(eq(palettes.id, id));

  return palette ?? null;
}

export type Palette = NonNullable<Awaited<ReturnType<typeof getPalette>>>;
