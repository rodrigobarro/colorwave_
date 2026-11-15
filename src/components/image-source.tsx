"use client";

import { useEffect, useEffectEvent, useState, type DragEvent } from "react";
import { ColorStrip } from "@/components/color-strip";
import { imageStyles, type ImageStyle } from "@/lib/image-palette";
import {
  createSourceImage,
  UnreadableImageError,
  type SourceImage,
} from "@/lib/source-image";

const imageStyleNames = Object.keys(imageStyles) as ImageStyle[];

const actionClassName =
  "cursor-pointer rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 has-focus-visible:outline-2 has-focus-visible:outline-offset-2";

function firstImage(files: FileList | null | undefined) {
  return Array.from(files ?? []).find((file) => file.type.startsWith("image/"));
}

// Visually hidden but still focusable, so its label works from the keyboard.
function FileInput({ onFile }: { onFile: (file: File) => void }) {
  return (
    <input
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(event) => {
        const file = firstImage(event.target.files);

        // Cleared so picking the same file again still fires a change.
        event.target.value = "";
        if (file) onFile(file);
      }}
    />
  );
}

export function ImageSource({
  image,
  style,
  isActive,
  onImage,
  onStyle,
  onRemove,
}: {
  image: SourceImage | null;
  style: ImageStyle;
  // Whether the palette's colors currently come from this image.
  isActive: boolean;
  onImage: (image: SourceImage) => void;
  onStyle: (style: ImageStyle) => void;
  onRemove: () => void;
}) {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function read(file: File) {
    setIsReading(true);
    setError(null);

    try {
      onImage(await createSourceImage(file));
    } catch (problem) {
      setError(
        problem instanceof UnreadableImageError
          ? "Couldn’t read this image. Try a JPEG, PNG or WebP."
          : "Something went wrong reading this image. Try again.",
      );
    } finally {
      setIsReading(false);
    }
  }

  // Pasting works anywhere on the page while this panel is open, as long as
  // the clipboard holds an image; pasted text still goes to the name field.
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const file = firstImage(event.clipboardData?.files);

    if (!file) return;

    event.preventDefault();
    read(file);
  });

  useEffect(() => {
    document.addEventListener("paste", onPaste);

    return () => document.removeEventListener("paste", onPaste);
  }, []);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    const file = firstImage(event.dataTransfer.files);

    if (file) read(file);
  }

  const dropTarget = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop,
  };

  return (
    <div className="flex flex-col gap-4">
      {image ? (
        <div className="flex flex-col gap-2" {...dropTarget}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local
              object URL, which next/image can't optimize. */}
          <img
            src={image.url}
            alt="The image the palette is made from"
            className={`max-h-56 w-full rounded-xl bg-foreground/5 object-contain ring-1 ring-foreground/10 ${
              isDragging ? "opacity-50" : ""
            }`}
          />
          <div className="flex flex-wrap gap-2">
            <label className={actionClassName}>
              {isReading ? "Reading…" : "Replace image"}
              <FileInput onFile={read} />
            </label>
            <button
              type="button"
              className={actionClassName}
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
            isDragging ? "border-foreground bg-foreground/5" : "border-foreground/20"
          }`}
          {...dropTarget}
        >
          <span className="font-medium">
            {isReading ? "Reading the image…" : "Choose an image"}
          </span>
          <span className="text-foreground/60">
            or drop or paste one here
          </span>
          <FileInput onFile={read} />
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      {image && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Colors to pick</h3>
          <div className="grid grid-cols-2 gap-2">
            {imageStyleNames.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={isActive && name === style}
                className="flex flex-col gap-2 rounded-lg p-2 text-left text-xs ring-1 ring-foreground/15 aria-pressed:ring-2 aria-pressed:ring-foreground"
                onClick={() => onStyle(name)}
              >
                <ColorStrip colors={image.palettes[name]} />
                {imageStyles[name].label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
