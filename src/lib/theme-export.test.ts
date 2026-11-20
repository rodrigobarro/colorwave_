import { describe, expect, it } from "vitest";
import { generateColors } from "@/lib/color";
import { deriveTheme, EXTRA_TOKENS, THEME_TOKENS } from "@/lib/theme";
import { exportTheme, THEME_EXPORT_FORMATS } from "@/lib/theme-export";

const theme = deriveTheme(generateColors("#3366ff", "triadic"));
const source = { name: "Ocean", url: "https://colorwave.vercel.app/palette/7" };

describe("exportTheme", () => {
  it("names the palette, its link and the theme version in every format", () => {
    for (const { id } of THEME_EXPORT_FORMATS) {
      const output = exportTheme(theme, id, source);

      expect(output, id).toContain("Ocean");
      expect(output, id).toContain(source.url);
      expect(output, id).toContain(`v${theme.version}`);
    }
  });

  it("writes shadcn/ui variables for both schemes, and maps only the extras", () => {
    const css = exportTheme(theme, "shadcn", source);

    expect(css).toMatch(/:root \{[^}]*--primary: oklch\([\d. ]+\);/);
    expect(css).toMatch(/\.dark \{[^}]*--primary: oklch\([\d. ]+\);/);
    for (const token of THEME_TOKENS) {
      expect(css.match(new RegExp(`--${token}:`, "g")), token).toHaveLength(2);
    }
    for (const token of EXTRA_TOKENS) {
      expect(css).toContain(`--color-${token}: var(--${token});`);
    }
    expect(css).not.toContain("--color-primary:");
  });

  it("maps every token to a Tailwind color", () => {
    const css = exportTheme(theme, "tailwind", source);

    expect(css).toContain("@custom-variant dark");
    for (const token of THEME_TOKENS) {
      expect(css).toContain(`--color-${token}: var(--${token});`);
    }
  });

  it("writes W3C design tokens with an sRGB fallback", () => {
    const tokens = JSON.parse(exportTheme(theme, "json", source));

    expect(Object.keys(tokens.light)).toEqual([...THEME_TOKENS]);
    expect(tokens.dark.primary).toEqual({
      $type: "color",
      $value: {
        colorSpace: "oklch",
        components: expect.any(Array),
        hex: expect.stringMatching(/^#[0-9a-f]{6}$/),
      },
    });
  });

  it("gives the AI prompt rules, the code and a hex table", () => {
    const markdown = exportTheme(theme, "prompt", source);

    expect(markdown).toContain("Never use Tailwind's built-in palette");
    expect(markdown).toContain("```css");
    expect(markdown).toContain("@theme inline");
    expect(markdown.match(/^\| `[a-z0-9-]+` \| #[0-9A-F]{6} \| #[0-9A-F]{6} \|$/gm)).toHaveLength(
      THEME_TOKENS.length,
    );
  });
});
