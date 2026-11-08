import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { PaletteSwatches } from "@/components/palette-swatches";
import type { PaletteSummary } from "@/lib/palettes";

export function PaletteCard({ palette }: { palette: PaletteSummary }) {
  return (
    <>
      <PaletteSwatches colors={palette.colors} />
      <IntentPrefetchLink
        href={`/palette/${palette.id}`}
        className="mt-3 block text-sm font-medium hover:underline"
      >
        {palette.name}
      </IntentPrefetchLink>
    </>
  );
}
