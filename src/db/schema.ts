import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Oklch } from "@/lib/color";

export const palettes = pgTable("palettes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  colors: jsonb().$type<readonly Oklch[]>().notNull(),
  purpose: text().notNull().default("gradient"),
  authorId: uuid(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
