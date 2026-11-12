import type { Oklch } from "@/lib/color";
import {
  buildPreviewDocument,
  type PreviewDefinition,
} from "@/lib/previews/contract";
import { previews } from "@/lib/previews/registry";

// Like PaletteView, it renders on the server for public palettes and in the
// browser for private ones, so it has no "use client".

// The iframe gets the size, and its wrapper scrolls sideways when the iframe is
// wider than the screen.
function frameStyle(frame: PreviewDefinition["frame"]) {
  return "height" in frame
    ? { height: frame.height }
    : { aspectRatio: frame.aspectRatio, minWidth: frame.minWidth };
}

export function PreviewFrame({
  preview,
  colors,
  paletteName,
  lazy,
}: {
  preview: PreviewDefinition;
  colors: readonly Oklch[];
  paletteName: string;
  lazy: boolean;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl ring-1 ring-foreground/10">
      {/* An empty sandbox gives the document an opaque origin with no
          scripts, forms, popups or navigation, so it can't reach this site,
          its cookies or the visitor's session. Nothing in a preview is
          interactive, so it takes no pointer events: a swipe on it scrolls the
          wrapper instead of stopping inside the frame. */}
      <iframe
        title={`${preview.name} preview of ${paletteName}`}
        srcDoc={buildPreviewDocument(preview, colors)}
        sandbox=""
        referrerPolicy="no-referrer"
        loading={lazy ? "lazy" : undefined}
        tabIndex={-1}
        className="pointer-events-none block w-full"
        style={frameStyle(preview.frame)}
      />
    </div>
  );
}

export function PalettePreviews({
  colors,
  paletteName,
}: {
  colors: readonly Oklch[];
  paletteName: string;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-sm font-medium">Previews</h2>
      {previews.map((preview, index) => (
        <figure key={preview.id} className="flex flex-col gap-2">
          <PreviewFrame
            preview={preview}
            colors={colors}
            paletteName={paletteName}
            // The first one is usually on screen; the rest load as they near it.
            lazy={index > 0}
          />
          <figcaption className="flex flex-wrap gap-x-2 text-xs">
            <span className="font-medium">{preview.name}</span>
            <span className="text-foreground/60">{preview.description}</span>
          </figcaption>
        </figure>
      ))}
    </section>
  );
}
