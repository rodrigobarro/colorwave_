import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Oklch } from "@/lib/color";
import { MAX_NAME_LENGTH } from "@/lib/draft";
import type { PaletteInput } from "@/lib/palette-input";
import { publishPalette } from "./actions";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));

  return {
    getSession: vi.fn(),
    updateTag: vi.fn(),
    where,
    values,
    returning,
    db: {
      select: vi.fn(() => ({ from: () => ({ where }) })),
      insert: vi.fn(() => ({ values })),
    },
  };
});

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("@/lib/auth/server", () => ({
  auth: { getSession: mocks.getSession },
}));
vi.mock("@/db", () => ({ db: mocks.db }));

const USER_ID = "3f0c8a52-6a1e-4f7b-9a43-2d1b5c7e9f10";
const colors: Oklch[] = [
  [0.4, 0.1, 200],
  [0.7, 0.15, 220],
];
const origin = { base: "#2f6fde", harmony: "analogous" } as const;

function signIn() {
  mocks.getSession.mockResolvedValue({ data: { user: { id: USER_ID } } });
}

function publishedRecently(count: number) {
  mocks.where.mockResolvedValue([{ recent: count }]);
}

function expectNothingPublished() {
  expect(mocks.db.insert).not.toHaveBeenCalled();
  expect(mocks.updateTag).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  signIn();
  publishedRecently(0);
  mocks.returning.mockResolvedValue([{ id: 54 }]);
});

describe("publishPalette", () => {
  it("publishes the palette for the signed-in user", async () => {
    const result = await publishPalette({
      name: "  Mar  ",
      colors,
      base: "#2F6FDE",
      harmony: "analogous",
    });

    expect(result).toEqual({ id: 54 });
    expect(mocks.values).toHaveBeenCalledWith({
      name: "Mar",
      colors,
      ...origin,
      authorId: USER_ID,
    });
    expect(mocks.updateTag).toHaveBeenCalledWith("palettes");
    expect(mocks.updateTag).toHaveBeenCalledTimes(1);
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue({ data: null });

    const result = await publishPalette({ name: "Mar", colors, ...origin });

    expect(result).toEqual({ error: "Entre para publicar a paleta." });
    expectNothingPublished();
  });

  it.each([
    ["an empty name", ""],
    ["a blank name", "   "],
    ["a name that is too long", "a".repeat(MAX_NAME_LENGTH + 1)],
  ])("rejects %s", async (_, name) => {
    const result = await publishPalette({ name, colors, ...origin });

    expect(result).toEqual({ error: "Dê um nome à paleta antes de publicar." });
    expectNothingPublished();
  });

  it("rejects a name that isn't a string", async () => {
    const result = await publishPalette({
      name: 42 as unknown as string,
      colors,
      ...origin,
    });

    expect(result).toEqual({ error: "Dê um nome à paleta antes de publicar." });
    expectNothingPublished();
  });

  it("rejects invalid colors", async () => {
    const result = await publishPalette({
      name: "Mar",
      colors: [[0.4, 0.1, 200]],
      ...origin,
    });

    expect(result).toEqual({ error: "Esta paleta tem cores inválidas." });
    expectNothingPublished();
  });

  it.each([
    ["an invalid base", { base: "blue" }],
    ["an unknown harmony", { harmony: "tetradic" }],
  ])("rejects %s", async (_, change) => {
    const result = await publishPalette({
      name: "Mar",
      colors,
      ...origin,
      ...change,
    } as PaletteInput);

    expect(result).toEqual({ error: "Esta paleta tem cores inválidas." });
    expectNothingPublished();
  });

  it("counts only the user's palettes from the last hour", async () => {
    await publishPalette({ name: "Mar", colors, ...origin });

    const condition = mocks.where.mock.calls[0][0] as SQL;
    const query = new PgDialect({ casing: "snake_case" }).sqlToQuery(condition);

    expect(query.sql).toBe(
      `("palettes"."author_id" = $1 and "palettes"."created_at" > now() - interval '1 hour')`,
    );
    expect(query.params).toEqual([USER_ID]);
  });

  it("publishes the last palette allowed in the hour", async () => {
    publishedRecently(9);

    const result = await publishPalette({ name: "Mar", colors, ...origin });

    expect(result).toEqual({ id: 54 });
    expect(mocks.values).toHaveBeenCalled();
  });

  it("stops publishing after 10 palettes in an hour", async () => {
    publishedRecently(10);

    const result = await publishPalette({ name: "Mar", colors, ...origin });

    expect(result).toEqual({
      error: "Você publicou muitas paletas na última hora. Tente mais tarde.",
    });
    expectNothingPublished();
  });
});
