"use client";

import { useSyncExternalStore } from "react";
import { PaletteEditor } from "@/components/palette-editor";
import { SaveNewPaletteButton } from "@/components/save-new-palette-button";
import {
  getDraft,
  getInitialDraft,
  saveDraft,
  subscribeToDraft,
} from "@/lib/draft";

// New palettes keep their draft in localStorage until they are saved.
export function CreatePalette() {
  const draft = useSyncExternalStore(
    subscribeToDraft,
    getDraft,
    getInitialDraft,
  );

  return (
    <PaletteEditor
      draft={draft}
      onChange={saveDraft}
      backHref="/"
      renderAction={(requireName) => (
        <SaveNewPaletteButton draft={draft} onMissingName={requireName} />
      )}
    />
  );
}
