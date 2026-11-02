import { count, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { palettes } from "@/db/schema";

const PAGE_SIZE = 12;

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
