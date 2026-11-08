import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { authUsers } from "@/db/auth-schema";
import { palettes } from "@/db/schema";

export const PAGE_SIZE = 12;

// Private palettes must never reach a shared cache, so every query a visitor
// can trigger goes through `publicQueries`, which all apply this condition.
// The tests check that each of them does.
export const isPublic = eq(palettes.visibility, "public");

// Newest first by when a palette entered the gallery, not when it was made:
// a palette kept private for a month still lands on top when published.
const galleryOrder = [desc(palettes.publishedAt), desc(palettes.id)];

const summary = {
  id: palettes.id,
  name: palettes.name,
  colors: palettes.colors,
  visibility: palettes.visibility,
};

const details = {
  ...summary,
  base: palettes.base,
  harmony: palettes.harmony,
  authorId: palettes.authorId,
  authorName: authUsers.name,
  createdAt: palettes.createdAt,
};

export const publicQueries = {
  count: () => db.select({ total: count() }).from(palettes).where(isPublic),

  page: (page: number) =>
    db
      .select(summary)
      .from(palettes)
      .where(isPublic)
      .orderBy(...galleryOrder)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),

  newestIds: (limit: number) =>
    db
      .select({ id: palettes.id })
      .from(palettes)
      .where(isPublic)
      .orderBy(...galleryOrder)
      .limit(limit),

  palette: (id: number) =>
    db
      .select(details)
      .from(palettes)
      .leftJoin(authUsers, eq(palettes.authorId, authUsers.id))
      .where(and(eq(palettes.id, id), isPublic)),
};

// Only for responses sent to the signed-in author, never cached.
export const authorQueries = {
  list: (authorId: string) =>
    db
      .select(summary)
      .from(palettes)
      .where(eq(palettes.authorId, authorId))
      .orderBy(desc(palettes.id)),

  palette: (id: number, authorId: string) =>
    db
      .select(details)
      .from(palettes)
      .leftJoin(authUsers, eq(palettes.authorId, authUsers.id))
      .where(and(eq(palettes.id, id), eq(palettes.authorId, authorId))),
};
