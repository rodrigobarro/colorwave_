import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { PaletteSwatches } from "@/components/palette-swatches";
import type { PaletteSummary } from "@/lib/palettes";

export function PaletteCard({ palette }: { palette: PaletteSummary }) {
  return (
    <>
      <PaletteSwatches colors={palette.colors} />
      <div className="mt-3 flex items-center gap-2">
        <IntentPrefetchLink
          href={`/palette/${palette.id}`}
          className="text-sm font-medium hover:underline"
        >
          {palette.name}
        </IntentPrefetchLink>
        {/* Only the author's own list includes private palettes. */}
        {palette.visibility === "private" && (
          <span className="rounded-full px-2 py-0.5 text-xs text-foreground/60 ring-1 ring-foreground/15">
            Private
          </span>
        )}
      </div>
    </>
  );
}
