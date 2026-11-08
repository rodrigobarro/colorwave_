import { drizzle } from "drizzle-orm/neon-http";
import { describe, expect, it, vi } from "vitest";
import { authorQueries, publicQueries } from "./palette-queries";

vi.mock("@/db", () => ({ db: drizzle.mock({ casing: "snake_case" }) }));

const AUTHOR_ID = "3f0c8a52-6a1e-4f7b-9a43-2d1b5c7e9f10";

// A query leaking a private palette into a shared cache would be served to
// everyone, so each public query is checked for the visibility condition.
describe("publicQueries", () => {
  it.each([
    ["count", publicQueries.count()],
    ["page", publicQueries.page(2)],
    ["newestIds", publicQueries.newestIds(100)],
    ["palette", publicQueries.palette(7)],
  ])("%s only reads public palettes", (_, query) => {
    const { sql, params } = query.toSQL();
    const placeholder = sql.match(/"palettes"\."visibility" = \$(\d+)/);

    expect(placeholder).not.toBeNull();
    expect(params[Number(placeholder![1]) - 1]).toBe("public");
  });

  it.each([
    ["page", publicQueries.page(1)],
    ["newestIds", publicQueries.newestIds(100)],
  ])("%s orders the gallery by publication", (_, query) => {
    expect(query.toSQL().sql).toContain(
      `order by "palettes"."published_at" desc, "palettes"."id" desc`,
    );
  });
});

describe("authorQueries", () => {
  it.each([
    ["list", authorQueries.list(AUTHOR_ID)],
    ["palette", authorQueries.palette(7, AUTHOR_ID)],
  ])("%s only reads the author's palettes", (_, query) => {
    const { sql, params } = query.toSQL();

    expect(sql).toMatch(/"palettes"\."author_id" = \$\d+/);
    expect(params).toContain(AUTHOR_ID);
  });
});
