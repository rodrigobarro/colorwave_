import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export const db = drizzle({
  client: neon(process.env.DATABASE_URL!),
  casing: "snake_case",
});
