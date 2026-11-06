import { describe, expect, it } from "vitest";
import { toReturnUrl } from "./return-path";

const ORIGIN = "https://colorwave.vercel.app";

describe("toReturnUrl", () => {
  it.each(["/", "/me", "/palette/7/edit", "/create?publish=1"])(
    "keeps %s",
    (path) => {
      expect(toReturnUrl(path, ORIGIN).href).toBe(`${ORIGIN}${path}`);
    },
  );

  it.each([
    null,
    "",
    "me",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
  ])("sends %j home", (value) => {
    expect(toReturnUrl(value, ORIGIN).href).toBe(`${ORIGIN}/`);
  });
});
