"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { GradientPreview } from "@/components/gradient-preview";
import { PreviewFrame } from "@/components/palette-previews";
import type { Oklch } from "@/lib/color";
import { previews } from "@/lib/previews/registry";

// How long the colors have to stay still before the framed previews catch up.
const FRAME_DELAY_MS = 150;

// A framed preview can't be updated in place: its sandbox gives it an opaque
// origin, so the only way in is a new srcdoc, which reloads the whole document.
// Reloading on every step of a slider drag makes it flicker and stutter, so the
// frames get the colors once they settle.
function useSettledValue<T>(value: T, delay: number) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setSettled(value), delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return settled;
}

export function EditorPreviews({
  colors,
  paletteName,
}: {
  colors: readonly Oklch[];
  paletteName: string;
}) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const settledColors = useSettledValue(colors, FRAME_DELAY_MS);
  const id = useId();
  const preview = previews[selected];

  function select(index: number) {
    const next = (index + previews.length) % previews.length;

    setSelected(next);
    tabs.current[next]?.focus();
  }

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern; Tab moves
  // on to the panel.
  function onKeyDown(event: KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowLeft: selected - 1,
      ArrowRight: selected + 1,
      Home: 0,
      End: previews.length - 1,
    };

    if (!(event.key in moves)) return;

    event.preventDefault();
    select(moves[event.key]);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Prévias</h2>

      <div
        role="tablist"
        aria-label="Prévias da paleta"
        className="flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        {previews.map((item, index) => (
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
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 aria-selected:bg-foreground aria-selected:text-background aria-selected:ring-foreground"
            onClick={() => setSelected(index)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <figure
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${preview.id}`}
        // Nothing inside is focusable, so the panel itself takes focus.
        tabIndex={0}
        className="flex flex-col gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {/* The gradient needs no frame, so it follows every change at once. */}
        {preview.id === "gradient" ? (
          <GradientPreview colors={colors} />
        ) : (
          <PreviewFrame
            preview={preview}
            colors={settledColors}
            paletteName={paletteName}
            lazy={false}
          />
        )}
        <figcaption className="text-xs text-foreground/60">
          {preview.description}
        </figcaption>
      </figure>
    </section>
  );
}
