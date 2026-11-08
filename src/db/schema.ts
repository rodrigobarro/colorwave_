import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Harmony, Oklch } from "@/lib/color";
import type { Visibility } from "@/lib/visibility";

export const palettes = pgTable("palettes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  colors: jsonb().$type<readonly Oklch[]>().notNull(),
  purpose: text().notNull().default("gradient"),
  // What the editor started from. Seed palettes predate these and have none.
  base: text(),
  harmony: text().$type<Harmony>(),
  authorId: uuid(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  visibility: text().$type<Visibility>().notNull().default("private"),
  // When the palette first entered the gallery, which orders by it. Kept when
  // it goes private again, so republishing doesn't jump it back to the top.
  publishedAt: timestamp({ withTimezone: true }),
}, (table) => [
  check("palettes_visibility_check", sql`${table.visibility} in ('public', 'private')`),
  check(
    "palettes_public_published_check",
    sql`${table.visibility} = 'private' or ${table.publishedAt} is not null`,
  ),
]);
