import { MAX_COLORS, readableOn, toCss, type Oklch } from "@/lib/color";
import type { Scheme } from "@/lib/color-roles";
import { THEME_TOKENS, type Theme } from "@/lib/theme";

// A preview shows a palette applied to something: a gradient, a landing page,
// a chart. It is a template of HTML and CSS with no scripts, rendered in a
// sandboxed iframe, and it gets the palette through CSS custom properties:
//
//   --color-1 … --color-N, --on-color-N    each palette color, in order, and a
//                                          text color readable on it
//   --color-count, --colors                how many there are, and all of them
//                                          as a list, for gradients
//   --background, --foreground, --primary  the palette's theme (deriveTheme) in
//   … every token in THEME_TOKENS          the scheme being shown, named as in
//                                          the exported theme
//
// Interface previews use the theme tokens, so a preview looks the way a project
// using the exported theme will, with the same contrast guarantees: text in a
// *-foreground on its color; primary, highlight, destructive, success and info
// as text on any surface and on a 20% tint of themselves mixed in sRGB
// (color-mix(in srgb, var(--success) 20%, var(--card))); warning only as a fill.
//
// Any element with data-color="K" gets --c and --on-c set to the Kth color and
// is hidden when the palette has fewer than K colors, so a template can list up
// to MAX_COLORS items (bars, legend rows) and show as many as the palette has.
// <html> carries data-scheme="light|dark" and data-colors="N".
//
// The built-in previews use this same contract, so it is tested on real
// previews before anyone else writes one. A new, incompatible contract gets a
// new apiVersion, and each preview states the one it was written for.

// 2: the theme tokens replaced the roles (--bg, --surface, --fg, --muted,
// --primary, --accent), and the scheme can be either one.
export const PREVIEW_API_VERSION = 2;

export type PreviewFrame =
  // Scales with the page down to minWidth, the narrowest width the preview is
  // designed for; on smaller screens it keeps that width and scrolls sideways,
  // so templates show a desktop layout and need no rules for phones.
  | { aspectRatio: string; minWidth: number }
  // Fills the page's width at a fixed height, for previews that fit any width.
  | { height: number };

export type PreviewDefinition = {
  id: string;
  name: string;
  description: string;
  apiVersion: typeof PREVIEW_API_VERSION;
  frame: PreviewFrame;
  html: string;
  css: string;
};

// Blocks every network request from inside the preview. The sandbox already
// stops scripts, forms and navigation, but not loading images or fonts, and a
// remote image would tell a third party the IP of everyone viewing a palette.
export const PREVIEW_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:";

export const MAX_TEMPLATE_LENGTH = 50_000;

function declarations(colors: readonly Oklch[], theme: Theme, scheme: Scheme) {
  const lines: string[] = [];

  colors.forEach((color, index) => {
    lines.push(`--color-${index + 1}: ${toCss(color)};`);
    lines.push(`--on-color-${index + 1}: ${readableOn(color)};`);
  });
  lines.push(`--color-count: ${colors.length};`);
  lines.push(`--colors: ${colors.map(toCss).join(", ")};`);

  for (const token of THEME_TOKENS) {
    lines.push(`--${token}: ${toCss(theme[scheme][token])};`);
  }
  lines.push(`color-scheme: ${scheme};`);

  return lines.join("\n");
}

function colorSlots(count: number) {
  return Array.from({ length: MAX_COLORS }, (_, index) => {
    const slot = index + 1;

    return slot <= count
      ? `[data-color="${slot}"] { --c: var(--color-${slot}); --on-c: var(--on-color-${slot}); }`
      : `[data-color="${slot}"] { display: none !important; }`;
  }).join("\n");
}

const baseCss = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; overflow: hidden; }
body {
  background: var(--background);
  color: var(--foreground);
  font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}`;

// The whole document goes in the iframe's srcdoc, so it renders the same on
// the server for public palettes and in the browser for private ones. The
// theme is passed in, since deriving it takes a while and the caller usually
// has it already; the scheme defaults to the one the palette reads as.
export function buildPreviewDocument(
  preview: PreviewDefinition,
  colors: readonly Oklch[],
  theme: Theme,
  scheme: Scheme = theme.scheme,
) {
  const css = declarations(colors, theme, scheme);

  return `<!doctype html>
<html data-scheme="${scheme}" data-colors="${colors.length}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">
<style>
:root {
${css}
}
${baseCss}
${colorSlots(colors.length)}
</style>
<style>
${preview.css}
</style>
</head>
<body>
${preview.html}
</body>
</html>`;
}

const forbidden: [RegExp, string][] = [
  [/<\s*script/i, "has a <script> tag"],
  [/\son[a-z]+\s*=/i, "has an inline event handler"],
  [/<\s*(link|meta|base|iframe|object|embed|form|input|button|textarea|select)\b/i, "has an element previews can't use"],
  [/\b(href|src|srcset|action)\s*=/i, "links to another resource"],
  [/<\s*\/\s*style/i, "closes the <style> tag"],
  [/@import/i, "imports a stylesheet"],
  [/url\(\s*(?!["']?data:)/i, "loads a URL from CSS"],
];

// A lint for the templates we write ourselves, so they keep to the contract
// (no scripts, nothing loaded from elsewhere, nothing focusable). It isn't the
// security boundary: the sandbox and the CSP are. Accepting templates from
// other people will need a real HTML and CSS sanitizer as well.
export function findTemplateProblems(preview: PreviewDefinition) {
  const problems: string[] = [];
  const source = `${preview.html}\n${preview.css}`;

  if (preview.html.length + preview.css.length > MAX_TEMPLATE_LENGTH) {
    problems.push(`is longer than ${MAX_TEMPLATE_LENGTH} characters`);
  }

  for (const [pattern, problem] of forbidden) {
    if (pattern.test(source)) problems.push(problem);
  }

  return problems;
}
