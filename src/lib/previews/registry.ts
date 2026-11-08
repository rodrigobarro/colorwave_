import { chart } from "@/lib/previews/built-in/chart";
import { gradient } from "@/lib/previews/built-in/gradient";
import { landingPage } from "@/lib/previews/built-in/landing-page";
import { spreadsheet } from "@/lib/previews/built-in/spreadsheet";
import type { PreviewDefinition } from "@/lib/previews/contract";

// Every palette shows these, in this order. Once there are more previews than
// fit on a page, the palette's author picks which ones it shows.
export const previews: readonly PreviewDefinition[] = [
  gradient,
  landingPage,
  spreadsheet,
  chart,
];
