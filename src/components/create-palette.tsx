"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PaletteEditor } from "@/components/palette-editor";
import { SaveNewPaletteButton } from "@/components/save-new-palette-button";
import {
  getDraft,
  getInitialDraft,
  saveDraft,
  subscribeToDraft,
} from "@/lib/draft";
import { readDraftImage, writeDraftImage } from "@/lib/draft-image";
import {
  loadSourceImage,
  releaseSourceImage,
  type SourceImage,
} from "@/lib/source-image";

// The draft's image is restored from IndexedDB after the page loads, unless the
// user picks another one first.
function useDraftImage() {
  const [image, setImage] = useState<SourceImage | null>(null);
  const hasChanged = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    readDraftImage()
      .then((blob) => (blob ? loadSourceImage(blob) : null))
      .then((restored) => {
        if (isCurrent && !hasChanged.current) setImage(restored);
        else releaseSourceImage(restored);
      })
      // A stored image the browser can no longer read is just dropped.
      .catch(() => writeDraftImage(null));

    return () => {
      isCurrent = false;
    };
  }, []);

  function changeImage(next: SourceImage | null) {
    hasChanged.current = true;
    releaseSourceImage(image);
    setImage(next);
    writeDraftImage(next?.blob ?? null);
  }

  return [image, changeImage] as const;
}

// New palettes keep their draft in localStorage until they are saved.
export function CreatePalette() {
  const draft = useSyncExternalStore(
    subscribeToDraft,
    getDraft,
    getInitialDraft,
  );
  const [image, setImage] = useDraftImage();

  return (
    <PaletteEditor
      draft={draft}
      onChange={saveDraft}
      image={image}
      onImageChange={setImage}
      backHref="/"
      renderAction={(requireName) => (
        <SaveNewPaletteButton draft={draft} onMissingName={requireName} />
      )}
    />
  );
}
