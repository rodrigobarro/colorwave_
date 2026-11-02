import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  // Migrations need a direct connection, without the PgBouncer pooler.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
});
