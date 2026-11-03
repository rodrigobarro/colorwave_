import {
  generateColors,
  harmonies,
  isPaletteColors,
  type Harmony,
  type Oklch,
} from "@/lib/color";

export type Draft = {
  name: string;
  base: string;
  harmony: Harmony;
  colors: readonly Oklch[];
};

export const MAX_NAME_LENGTH = 60;

const STORAGE_KEY = "colorwave:draft";
const INITIAL_BASE = "#2f6fde";
const INITIAL_HARMONY = "analogous";

const initialDraft: Draft = {
  name: "",
  base: INITIAL_BASE,
  harmony: INITIAL_HARMONY,
  colors: generateColors(INITIAL_BASE, INITIAL_HARMONY),
};

const listeners = new Set<() => void>();
let currentDraft: Draft | undefined;

function isDraft(value: Partial<Draft> | null): value is Draft {
  return (
    typeof value?.name === "string" &&
    /^#[0-9a-f]{6}$/i.test(value.base ?? "") &&
    Object.hasOwn(harmonies, value.harmony ?? "") &&
    isPaletteColors(value.colors)
  );
}

function readDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");

    return isDraft(stored) ? stored : initialDraft;
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
