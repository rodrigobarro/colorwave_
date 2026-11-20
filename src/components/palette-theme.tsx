"use client";

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { contrastRatio, toCss, toHex, type Oklch } from "@/lib/color";
import type { Scheme } from "@/lib/color-roles";
import { SITE_URL } from "@/lib/site";
import {
  deriveTheme,
  TEXT_PAIRS,
  THEME_TOKENS,
  type ThemeColors,
  type ThemeToken,
} from "@/lib/theme";
import {
  exportTheme,
  THEME_EXPORT_FORMATS,
  type ThemeExportFormat,
} from "@/lib/theme-export";

// The theme derived from a palette: a small interface drawn with it, its
// colors by job, and the code to take it away. Rendered on the server for
// public palettes, with the scheme the palette reads as; a ?scheme= in the URL
// switches it once the page loads, so a link can open the dark theme.

const tabClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 aria-selected:bg-foreground aria-selected:text-background aria-selected:ring-foreground";
const buttonClassName = "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15";

type ThemeProps = {
  colors: readonly Oklch[];
  paletteId: number;
  paletteName: string;
};

function isScheme(value: string | null): value is Scheme {
  return value === "light" || value === "dark";
}

function themeVariables(colors: ThemeColors) {
  return Object.fromEntries(
    THEME_TOKENS.map((token) => [`--t-${token}`, toCss(colors[token])]),
  ) as CSSProperties;
}

// A product screen built only from theme tokens, the same way a project using
// the exported theme would build it.
function ThemeSample({ colors }: { colors: ThemeColors }) {
  const bars = [72, 48, 88, 36, 60];

  return (
    <div
      aria-hidden
      style={themeVariables(colors)}
      className="flex overflow-hidden rounded-xl bg-(--t-background) text-sm text-(--t-foreground) ring-1 ring-foreground/10"
    >
      <nav className="hidden w-40 shrink-0 flex-col gap-1 border-r border-(--t-sidebar-border) bg-(--t-sidebar) p-3 text-(--t-sidebar-foreground) sm:flex">
        <span className="mb-3 flex items-center gap-2 px-2 font-semibold">
          <i className="size-3 rounded-full bg-(--t-primary)" />
          Lumen
        </span>
        <span className="rounded-md bg-(--t-sidebar-accent) px-2 py-1.5 text-(--t-sidebar-accent-foreground)">
          Overview
        </span>
        {["Projects", "Reports", "Settings"].map((item) => (
          <span key={item} className="px-2 py-1.5">
            {item}
          </span>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Welcome back</span>
          <span className="text-(--t-muted-foreground)">
            Here’s what changed this week.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-(--t-primary) px-3 py-1.5 font-medium text-(--t-primary-foreground)">
            New project
          </span>
          <span className="rounded-md bg-(--t-secondary) px-3 py-1.5 text-(--t-secondary-foreground)">
            Invite
          </span>
          <span className="rounded-md border border-(--t-input) px-3 py-1.5">
            Export
          </span>
          <span className="rounded-md bg-(--t-accent) px-3 py-1.5 text-(--t-accent-foreground)">
            Filter
          </span>
          <span className="rounded-md bg-(--t-destructive) px-3 py-1.5 text-(--t-destructive-foreground)">
            Delete
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-lg border border-(--t-border) bg-(--t-card) p-4 text-(--t-card-foreground)">
            <span className="font-medium">Project name</span>
            <span className="rounded-md border border-(--t-input) px-3 py-1.5 text-(--t-muted-foreground)">
              My new project
            </span>
            <span className="rounded-md border border-(--t-ring) px-3 py-1.5 outline-2 outline-offset-1 outline-(--t-ring)/40">
              Lumen
            </span>
            <span className="text-xs text-(--t-destructive)">
              That name is already taken.
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs font-medium">
              <span className="rounded-full bg-(--t-highlight) px-2 py-0.5 text-(--t-highlight-foreground)">
                New
              </span>
              <span className="rounded-full bg-(--t-success) px-2 py-0.5 text-(--t-success-foreground)">
                Active
              </span>
              <span className="rounded-full bg-(--t-warning) px-2 py-0.5 text-(--t-warning-foreground)">
                Pending
              </span>
              <span className="rounded-full bg-(--t-info) px-2 py-0.5 text-(--t-info-foreground)">
                Beta
              </span>
              <span className="rounded-full bg-(--t-muted) px-2 py-0.5 text-(--t-muted-foreground)">
                Archived
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-(--t-border) bg-(--t-card) p-4 text-(--t-card-foreground)">
            <span className="font-medium">Visitors</span>
            <div className="flex h-28 items-end gap-2 border-b border-(--t-border)">
              {bars.map((height, index) => (
                <i
                  key={index}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${height}%`,
                    background: `var(--t-chart-${index + 1})`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-(--t-muted-foreground)">
              Last 5 weeks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TOKEN_GROUPS: { name: string; tokens: ThemeToken[] }[] = [
  { name: "Surfaces", tokens: ["background", "card", "secondary", "muted", "accent", "border"] },
  { name: "Text", tokens: ["foreground", "muted-foreground"] },
  { name: "Brand", tokens: ["primary", "highlight"] },
  { name: "Status", tokens: ["destructive", "success", "warning", "info"] },
  { name: "Charts", tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] },
];

function textFor(colors: ThemeColors, token: ThemeToken): Oklch {
  const pair = `${token}-foreground`;

  if (pair in colors) return colors[pair as ThemeToken];
  if (token === "foreground" || token === "muted-foreground") return colors.background;

  return colors.foreground;
}

function TokenList({ colors }: { colors: ThemeColors }) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {TOKEN_GROUPS.map(({ name, tokens }) => (
        <div key={name} className="flex flex-col gap-2">
          <h3 className="text-xs text-foreground/60">{name}</h3>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {tokens.map((token) => (
              <li key={token} className="flex items-center gap-3" title={toCss(colors[token])}>
                <span
                  aria-hidden
                  className="flex h-6 w-9 shrink-0 items-center justify-center rounded font-sans text-[10px] font-semibold ring-1 ring-foreground/10"
                  style={{
                    backgroundColor: toCss(colors[token]),
                    color: toCss(textFor(colors, token)),
                  }}
                >
                  Aa
                </span>
                <span className="min-w-0 flex-1 truncate">{token}</span>
                <span className="text-foreground/60">{toHex(colors[token])}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function lowestTextContrast(colors: ThemeColors) {
  return Math.min(
    ...TEXT_PAIRS.map(([surface, text]) => contrastRatio(colors[surface], colors[text])),
  );
}

function ThemeExport({
  output,
  format,
  onFormatChange,
}: {
  output: string;
  format: ThemeExportFormat;
  onFormatChange: (format: ThemeExportFormat) => void;
}) {
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [copied, setCopied] = useState(false);
  const selected = THEME_EXPORT_FORMATS.findIndex((item) => item.id === format);
  const current = THEME_EXPORT_FORMATS[selected];

  function select(index: number) {
    const next = (index + THEME_EXPORT_FORMATS.length) % THEME_EXPORT_FORMATS.length;

    onFormatChange(THEME_EXPORT_FORMATS[next].id);
    setCopied(false);
    tabs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowLeft: selected - 1,
      ArrowRight: selected + 1,
      Home: 0,
      End: THEME_EXPORT_FORMATS.length - 1,
    };

    if (!(event.key in moves)) return;

    event.preventDefault();
    select(moves[event.key]);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      // Only available on HTTPS or localhost, and the browser may deny it.
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = current.file;
    link.click();
    // Revoked once the browser has started the download.
    setTimeout(() => URL.revokeObjectURL(url));
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 id={`${id}-title`} className="text-sm font-medium">
        Use it
      </h3>
      <div
        role="tablist"
        aria-labelledby={`${id}-title`}
        className="flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        {THEME_EXPORT_FORMATS.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-selected={index === selected}
            aria-controls={`${id}-panel`}
            tabIndex={index === selected ? 0 : -1}
            className={tabClassName}
            onClick={() => select(index)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${current.id}`}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground/60">{current.hint}</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClassName} onClick={download}>
              Download {current.file}
            </button>
            <button
              type="button"
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
              onClick={copy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <pre
          // Scrolls on its own, so keyboard users need to be able to reach it.
          tabIndex={0}
          className="max-h-80 overflow-auto rounded-xl bg-foreground/5 p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap ring-1 ring-foreground/10"
        >
          <code>{output}</code>
        </pre>
        <span aria-live="polite" className="sr-only">
          {copied && `${current.name} copied`}
        </span>
      </div>
    </div>
  );
}

function ThemePanel({
  colors,
  paletteId,
  paletteName,
  requestedScheme,
}: ThemeProps & { requestedScheme: Scheme | null }) {
  const theme = useMemo(() => deriveTheme(colors), [colors]);
  const [format, setFormat] = useState<ThemeExportFormat>("prompt");
  const scheme = requestedScheme ?? theme.scheme;
  const schemeColors = theme[scheme];
  const output = useMemo(
    () =>
      exportTheme(theme, format, {
        name: paletteName,
        url: `${SITE_URL}/palette/${paletteId}`,
      }),
    [theme, format, paletteName, paletteId],
  );

  // Kept in the URL so the link opens the scheme being looked at. Next keeps
  // useSearchParams in step with replaceState.
  function chooseScheme(next: Scheme) {
    const url = new URL(window.location.href);

    if (next === theme.scheme) url.searchParams.delete("scheme");
    else url.searchParams.set("scheme", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Theme</h2>
          <p className="text-xs text-foreground/60">
            A full interface theme made from this palette. Every text color
            meets WCAG AA (lowest contrast here{" "}
            {lowestTextContrast(schemeColors).toFixed(1)}:1).
          </p>
        </div>
        <div
          role="group"
          aria-label="Color scheme"
          className="flex rounded-lg p-0.5 ring-1 ring-foreground/15"
        >
          {(["light", "dark"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={scheme === option}
              className="rounded-md px-3 py-1 text-sm capitalize aria-pressed:bg-foreground aria-pressed:text-background"
              onClick={() => chooseScheme(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <ThemeSample colors={schemeColors} />
      <TokenList colors={schemeColors} />
      <ThemeExport output={output} format={format} onFormatChange={setFormat} />
    </section>
  );
}

function ThemeFromUrl(props: ThemeProps) {
  const scheme = useSearchParams().get("scheme");

  return <ThemePanel {...props} requestedScheme={isScheme(scheme) ? scheme : null} />;
}

export function PaletteTheme(props: ThemeProps) {
  // The cached page can't read the URL, so it shows the palette's own scheme
  // until the browser takes over.
  return (
    <Suspense fallback={<ThemePanel {...props} requestedScheme={null} />}>
      <ThemeFromUrl {...props} />
    </Suspense>
  );
}
