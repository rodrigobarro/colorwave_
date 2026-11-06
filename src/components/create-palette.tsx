"use client";

import { useSyncExternalStore } from "react";
import { PaletteEditor } from "@/components/palette-editor";
import { PublishButton } from "@/components/publish-button";
import {
  getDraft,
  getInitialDraft,
  saveDraft,
  subscribeToDraft,
} from "@/lib/draft";

// New palettes keep their draft in localStorage until they are published.
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
        <PublishButton draft={draft} onMissingName={requireName} />
      )}
    />
  );
}
