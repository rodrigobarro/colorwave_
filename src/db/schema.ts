import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Harmony, Oklch } from "@/lib/color";

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
});
