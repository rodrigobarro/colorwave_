import { describe, expect, it } from "vitest";
import { MAX_COLORS, toCss, type Oklch } from "@/lib/color";
import {
  buildPreviewDocument,
  findTemplateProblems,
  PREVIEW_API_VERSION,
  PREVIEW_CSP,
  type PreviewDefinition,
} from "@/lib/previews/contract";
import { previews } from "@/lib/previews/registry";

const colors: Oklch[] = [
  [0.97, 0.01, 90],
  [0.55, 0.2, 260],
  [0.7, 0.17, 50],
];

const preview: PreviewDefinition = {
  id: "test",
  name: "Test",
  description: "A test preview.",
  apiVersion: PREVIEW_API_VERSION,
  frame: { height: 100 },
  html: `<p class="hello">Hello</p>`,
  css: `.hello { color: var(--primary); }`,
};

describe("buildPreviewDocument", () => {
  const document = buildPreviewDocument(preview, colors);

  it("blocks every network request from the preview", () => {
    expect(document).toContain(
      `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`,
    );
    expect(PREVIEW_CSP).toContain("default-src 'none'");
  });

  it("passes each color in order and the list of all of them", () => {
    colors.forEach((color, index) => {
      expect(document).toContain(`--color-${index + 1}: ${toCss(color)};`);
    });
    expect(document).toContain(`--color-count: 3;`);
    expect(document).toContain(`--colors: ${colors.map(toCss).join(", ")};`);
    expect(document).not.toContain("--color-4:");
  });

  it("passes the colors by role", () => {
    for (const role of ["bg", "surface", "fg", "muted", "primary", "accent"]) {
      expect(document).toMatch(new RegExp(`--${role}: oklch\\(`));
    }
    expect(document).toContain("--on-primary:");
  });

  it("hides color slots past the palette's size", () => {
    expect(document).toContain(`[data-color="3"] { --c: var(--color-3);`);
    expect(document).toContain(`[data-color="4"] { display: none !important; }`);
    expect(document).toContain(`[data-color="${MAX_COLORS}"] { display: none`);
  });

  it("describes the palette on the root element", () => {
    expect(document).toContain(`<html data-scheme="light" data-colors="3">`);
  });

  it("puts the template's CSS after the contract's, and its HTML in the body", () => {
    expect(document.indexOf(preview.css)).toBeGreaterThan(
      document.indexOf("[data-color="),
    );
    expect(document).toContain(`<body>\n${preview.html}\n</body>`);
  });
});

describe("findTemplateProblems", () => {
  const withHtml = (html: string) => findTemplateProblems({ ...preview, html });
  const withCss = (css: string) => findTemplateProblems({ ...preview, css });

  it("accepts a template within the contract", () => {
    expect(findTemplateProblems(preview)).toEqual([]);
    expect(withCss(`.a { background: url(data:image/png;base64,AAAA); }`)).toEqual([]);
  });

  it("rejects scripts and event handlers", () => {
    expect(withHtml(`<script>alert(1)</script>`)).toContain("has a <script> tag");
    expect(withHtml(`<p onclick="x()">Hi</p>`)).toContain("has an inline event handler");
  });

  it("rejects anything loaded from elsewhere", () => {
    expect(withHtml(`<img src="https://example.com/a.png">`)).toContain(
      "links to another resource",
    );
    expect(withCss(`.a { background: url(https://example.com/a.png); }`)).toContain(
      "loads a URL from CSS",
    );
    expect(withCss(`@import "https://example.com/a.css";`)).toContain(
      "imports a stylesheet",
    );
  });

  it("rejects CSS that ends the style element", () => {
    expect(withCss(`</style><p>Hi</p>`)).toContain("closes the <style> tag");
  });

  it("rejects templates that are too long", () => {
    expect(withHtml("a".repeat(60_000))).toHaveLength(1);
  });
});

describe("built-in previews", () => {
  it("have unique ids", () => {
    const ids = previews.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(previews.map((p) => [p.id, p] as const))(
    "%s keeps to the contract",
    (_, builtIn) => {
      expect(builtIn.apiVersion).toBe(PREVIEW_API_VERSION);
      expect(findTemplateProblems(builtIn)).toEqual([]);
    },
  );
});
