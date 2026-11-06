import { pgSchema, text, uuid } from "drizzle-orm/pg-core";

// Neon Auth owns this table, so it stays out of drizzle.config.ts and its
// migrations. Its columns are camelCase, hence the explicit names.
const neonAuth = pgSchema("neon_auth");

export const authUsers = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
});
