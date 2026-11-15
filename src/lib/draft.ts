import {
  generateColors,
  isHarmony,
  isHexColor,
  isPaletteColors,
  type Harmony,
  type Oklch,
} from "@/lib/color";
import { isImageStyle, type ImageStyle } from "@/lib/image-palette";

export type PaletteSource = "harmony" | "image";

// `source` says where the colors came from. Both origins keep their settings,
// so switching back to the other tab finds them as they were.
export type Draft = {
  name: string;
  source: PaletteSource;
  base: string;
  harmony: Harmony;
  imageStyle: ImageStyle;
  colors: readonly Oklch[];
};

export const MAX_NAME_LENGTH = 60;

const STORAGE_KEY = "colorwave:draft";
const INITIAL_BASE = "#2f6fde";
const INITIAL_HARMONY = "analogous";

const initialDraft: Draft = {
  name: "",
  source: "harmony",
  imageStyle: "dominant",
  base: INITIAL_BASE,
  harmony: INITIAL_HARMONY,
  colors: generateColors(INITIAL_BASE, INITIAL_HARMONY),
};

const listeners = new Set<() => void>();
let currentDraft: Draft | undefined;

export function isPaletteSource(value: unknown): value is PaletteSource {
  return value === "harmony" || value === "image";
}

function isDraft(value: Partial<Draft> | null): value is Draft {
  return (
    typeof value?.name === "string" &&
    isPaletteSource(value.source) &&
    isHexColor(value.base) &&
    isHarmony(value.harmony) &&
    isImageStyle(value.imageStyle) &&
    isPaletteColors(value.colors)
  );
}

function readDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    // Drafts saved before images existed have no source or image style.
    const draft = stored && {
      source: "harmony",
      imageStyle: "dominant",
      ...stored,
    };

    return isDraft(draft) ? draft : initialDraft;
  } catch {
    return initialDraft;
  }
}

export function getDraft() {
  currentDraft ??= readDraft();

  return currentDraft;
}

export function getInitialDraft() {
  return initialDraft;
}

export function saveDraft(draft: Draft) {
  currentDraft = draft;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be full or blocked; the draft stays in memory until reload.
  }

  listeners.forEach((listener) => listener());
}

export function subscribeToDraft(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
