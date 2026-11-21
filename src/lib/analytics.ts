import posthog from "posthog-js";
import type { Harmony } from "@/lib/color";
import type { Scheme } from "@/lib/color-roles";
import type { ImageStyle } from "@/lib/image-palette";
import type { PaletteSource } from "@/lib/draft";
import type { ThemeExportFormat } from "@/lib/theme-export";

// Product analytics, sent to PostHog. Every event the app records is listed
// here with its properties, so the names stay consistent and a dashboard can
// rely on them. Events carry ids and choices, never names, emails or colors a
// person typed: a palette is looked up by id when its details matter.
//
// PostHog runs only where NEXT_PUBLIC_POSTHOG_KEY is set (production), and
// without cookies or storage (see instrumentation-client.ts), so nothing here
// needs a consent banner and nothing is sent from development.

// Where an interface element sits when it appears on more than one page.
export type Place = "palette" | "editor";

export type AnalyticsEvents = {
  // The theme taken away from a palette page, the main thing to measure.
  theme_exported: {
    palette_id: number;
    format: ThemeExportFormat;
    action: "copy" | "download";
    scheme: Scheme;
  };
  theme_format_selected: { palette_id: number; format: ThemeExportFormat };
  scheme_changed: { scheme: Scheme; from: "previews" | "theme" };
  preview_selected: { preview: string; place: Place };
  color_copied: { format: "hex" };
  palette_saved: {
    source: PaletteSource;
    colors: number;
    harmony?: Harmony;
    image_style?: ImageStyle;
  };
  palette_updated: {
    palette_id: number;
    source: PaletteSource;
    colors: number;
  };
  palette_published: { palette_id: number };
  palette_unpublished: { palette_id: number };
  palette_deleted: { palette_id: number };
};

export type AnalyticsEvent = keyof AnalyticsEvents;

export function track<E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEvents[E],
) {
  // Not initialized without a key, as in development.
  if (!posthog.__loaded) return;

  posthog.capture(event, properties);
}
