import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Oklch } from "@/lib/color";
import type { PaletteInput } from "@/lib/palette-input";
import { deletePalette, updatePalette } from "./actions";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn<(condition: SQL) => { returning: typeof returning }>(
    () => ({ returning }),
  );
  const set = vi.fn(() => ({ where }));

  return {
    getSession: vi.fn(),
    updateTag: vi.fn(),
    returning,
    where,
    set,
    db: {
      update: vi.fn(() => ({ set })),
      delete: vi.fn(() => ({ where })),
    },
  };
});

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("@/lib/auth/server", () => ({
  auth: { getSession: mocks.getSession },
}));
vi.mock("@/db", () => ({ db: mocks.db }));

const USER_ID = "3f0c8a52-6a1e-4f7b-9a43-2d1b5c7e9f10";
const NOT_FOUND = { error: "This palette doesn't exist or isn't yours." };
const colors: Oklch[] = [
  [0.4, 0.1, 200],
  [0.7, 0.15, 220],
];
const input: PaletteInput = {
  name: "Mar",
  base: "#2f6fde",
  harmony: "triadic",
  colors,
};

function ownedRows(count: number) {
  mocks.returning.mockResolvedValue(
    Array.from({ length: count }, () => ({ id: 7 })),
  );
}

function expectOwnershipCondition() {
  const [condition] = mocks.where.mock.calls[0];
  const query = new PgDialect({ casing: "snake_case" }).sqlToQuery(condition);

  expect(query.sql).toBe(
    `("palettes"."id" = $1 and "palettes"."author_id" = $2)`,
  );
  expect(query.params).toEqual([7, USER_ID]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { user: { id: USER_ID } } });
  ownedRows(1);
});

describe("updatePalette", () => {
  it("updates the user's own palette", async () => {
    const result = await updatePalette(7, { ...input, name: "  Mar  " });

    expect(result).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith(input);
    expectOwnershipCondition();
    expect(mocks.updateTag).toHaveBeenCalledWith("palettes");
    expect(mocks.updateTag).toHaveBeenCalledWith("palette:7");
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue({ data: null });

    const result = await updatePalette(7, input);

    expect(result).toEqual({ error: "Sign in to edit this palette." });
    expect(mocks.db.update).not.toHaveBeenCalled();
  });

  it("doesn't touch a palette that isn't the user's", async () => {
    ownedRows(0);

    const result = await updatePalette(7, input);

    expect(result).toEqual(NOT_FOUND);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it.each([
    ["a blank name", { name: " " }, "Give the palette a name before saving."],
    ["invalid colors", { colors: [] }, "This palette has invalid colors."],
    ["an unknown harmony", { harmony: "x" }, "This palette has invalid colors."],
  ])("rejects %s", async (_, change, error) => {
    const result = await updatePalette(7, {
      ...input,
      ...change,
    } as PaletteInput);

    expect(result).toEqual({ error });
    expect(mocks.db.update).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a palette id", async () => {
    const result = await updatePalette(1.5, input);

    expect(result).toEqual(NOT_FOUND);
    expect(mocks.db.update).not.toHaveBeenCalled();
  });
});

describe("deletePalette", () => {
  it("deletes the user's own palette", async () => {
    const result = await deletePalette(7);

    expect(result).toBeUndefined();
    expectOwnershipCondition();
    expect(mocks.updateTag).toHaveBeenCalledWith("palettes");
    expect(mocks.updateTag).toHaveBeenCalledWith("palette:7");
  });

  it("requires a session", async () => {
    mocks.getSession.mockResolvedValue({ data: null });

    const result = await deletePalette(7);

    expect(result).toEqual({ error: "Sign in to delete this palette." });
    expect(mocks.db.delete).not.toHaveBeenCalled();
  });

  it("doesn't touch a palette that isn't the user's", async () => {
    ownedRows(0);

    const result = await deletePalette(7);

    expect(result).toEqual(NOT_FOUND);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a palette id", async () => {
    const result = await deletePalette("7; drop" as unknown as number);

    expect(result).toEqual(NOT_FOUND);
    expect(mocks.db.delete).not.toHaveBeenCalled();
  });
});
