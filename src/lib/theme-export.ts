import { toHex, type Oklch } from "@/lib/color";
import {
  EXTRA_TOKENS,
  THEME_TOKENS,
  type Theme,
  type ThemeColors,
  type ThemeToken,
} from "@/lib/theme";

// The ways a theme leaves Colorwave. Most people who take one are building
// with an AI tool, so the formats follow what those tools start from:
// shadcn/ui on Tailwind CSS 4, and a prompt that tells the model how to use it.

export const THEME_EXPORT_FORMATS = [
  {
    id: "prompt",
    name: "AI prompt",
    file: "DESIGN.md",
    language: "markdown",
    hint: "Paste into Claude, Cursor or v0, or save as DESIGN.md in your project. Works for slides and documents too.",
  },
  {
    id: "shadcn",
    name: "shadcn/ui",
    file: "globals.css",
    language: "css",
    hint: "Replace the color variables in your globals.css. Keep your --radius.",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    file: "globals.css",
    language: "css",
    hint: "Add after @import \"tailwindcss\". Gives you bg-primary, text-muted-foreground and the rest.",
  },
  {
    id: "json",
    name: "Design tokens",
    file: "theme.tokens.json",
    language: "json",
    hint: "W3C design tokens (DTCG), for Figma, Tokens Studio or Style Dictionary.",
  },
] as const;

export type ThemeExportFormat = (typeof THEME_EXPORT_FORMATS)[number]["id"];

export type ThemeSourceInfo = { name: string; url: string };

const round = (value: number, digits: number) => Number(value.toFixed(digits));

function formatOklch([lightness, chroma, hue]: Oklch) {
  // A hue means nothing without chroma; 0 keeps grays readable.
  const shownHue = chroma < 0.0005 ? 0 : round(hue, 2);

  return `oklch(${round(lightness, 3)} ${round(chroma, 3)} ${shownHue})`;
}

function variables(colors: ThemeColors, indent = "  ") {
  return THEME_TOKENS.map(
    (token) => `${indent}--${token}: ${formatOklch(colors[token])};`,
  ).join("\n");
}

function header(theme: Theme, source: ThemeSourceInfo) {
  return `/* ${source.name} · Colorwave theme v${theme.version}
   ${source.url} */`;
}

function themeInline(tokens: readonly ThemeToken[]) {
  return `@theme inline {
${tokens.map((token) => `  --color-${token}: var(--${token});`).join("\n")}
}`;
}

function schemeBlocks(theme: Theme) {
  return `:root {
${variables(theme.light)}
}

.dark {
${variables(theme.dark)}
}`;
}

function shadcn(theme: Theme, source: ThemeSourceInfo) {
  return `${header(theme, source)}

${schemeBlocks(theme)}

/* Colors shadcn/ui doesn't define. Skip this if your project already maps them. */
${themeInline(EXTRA_TOKENS)}
`;
}

function tailwind(theme: Theme, source: ThemeSourceInfo) {
  return `${header(theme, source)}

/* Dark mode follows a "dark" class on <html>. */
@custom-variant dark (&:where(.dark, .dark *));

${schemeBlocks(theme)}

${themeInline(THEME_TOKENS)}
`;
}

function json(theme: Theme, source: ThemeSourceInfo) {
  const group = (colors: ThemeColors) =>
    Object.fromEntries(
      THEME_TOKENS.map((token) => {
        const [lightness, chroma, hue] = colors[token];

        return [
          token,
          {
            $type: "color",
            $value: {
              colorSpace: "oklch",
              components: [round(lightness, 4), round(chroma, 4), round(hue, 2)],
              hex: toHex(colors[token]).toLowerCase(),
            },
          },
        ];
      }),
    );

  return `${JSON.stringify(
    {
      $description: `${source.name} · Colorwave theme v${theme.version} · ${source.url}`,
      $extensions: {
        "app.colorwave": {
          version: theme.version,
          source: source.url,
          defaultScheme: theme.scheme,
        },
      },
      light: group(theme.light),
      dark: group(theme.dark),
    },
    null,
    2,
  )}\n`;
}

// What each color is for, written for a model that will otherwise reach for
// its defaults. Each rule names the token so the model can't miss it.
const USAGE_RULES = [
  "Use only this theme's colors. Never use Tailwind's built-in palette (`bg-blue-500`, `text-gray-600`, `indigo`, `violet`, `slate`…), hard-coded hex values, or colors from your own defaults.",
  "Use the semantic classes: `bg-background`, `text-foreground`, `bg-primary`, `border-border` and so on. Each filled color has a matching `-foreground` for the text and icons on it; always use them as a pair (`bg-primary text-primary-foreground`).",
  "`primary`: the one main action on a screen, key links and focus rings. Not for large areas.",
  "`highlight`: the palette's second color, for small touches of personality: badges, icons, a word in a heading, illustrations. Never for body text or large backgrounds.",
  "`secondary`, `muted`, `accent`: quiet surfaces. Secondary buttons and tags use `secondary`; empty and disabled states use `muted`; hover and selected items in menus and lists use `accent`.",
  "`muted-foreground`: secondary text such as captions, hints and timestamps.",
  "`card` and `popover`: raised surfaces on top of `background`, separated by `border`.",
  "`destructive`, `success`, `warning`, `info`: only for status (errors, confirmations, warnings, notices), never as decoration.",
  "`chart-1` to `chart-5`: data series, in that order.",
  "Gradients, if any, only between colors of this theme.",
  "Support light and dark mode: a `dark` class on `<html>` switches the theme.",
];

function prompt(theme: Theme, source: ThemeSourceInfo) {
  const rows = THEME_TOKENS.map(
    (token) =>
      `| \`${token}\` | ${toHex(theme.light[token])} | ${toHex(theme.dark[token])} |`,
  ).join("\n");

  return `# Color theme: ${source.name}

Use this color theme for everything you design or build in this project. It comes from the "${source.name}" palette on Colorwave (${source.url}). Every text color already meets WCAG AA contrast on the surface it is meant for, in light and dark mode, so don't adjust them.

## Rules

${USAGE_RULES.map((rule) => `- ${rule}`).join("\n")}

## Code (Tailwind CSS 4, compatible with shadcn/ui)

Put this in the global stylesheet, after \`@import "tailwindcss";\`, replacing any other color variables:

\`\`\`css
${tailwind(theme, source).trim()}
\`\`\`

## Without code (slides, documents, images)

Use these hex values, following the same rules. Default to ${theme.scheme} mode.

| Token | Light | Dark |
| --- | --- | --- |
${rows}
`;
}

export function exportTheme(
  theme: Theme,
  format: ThemeExportFormat,
  source: ThemeSourceInfo,
) {
  switch (format) {
    case "prompt":
      return prompt(theme, source);
    case "shadcn":
      return shadcn(theme, source);
    case "tailwind":
      return tailwind(theme, source);
    case "json":
      return json(theme, source);
  }
}
