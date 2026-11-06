import Link from "next/link";
import { PaletteSwatches } from "@/components/palette-swatches";
import type { PaletteSummary } from "@/lib/palettes";

export function PaletteCard({ palette }: { palette: PaletteSummary }) {
  return (
    <>
      <PaletteSwatches colors={palette.colors} />
      <Link
        href={`/palette/${palette.id}`}
        className="mt-3 block text-sm font-medium hover:underline"
      >
        {palette.name}
      </Link>
    </>
  );
}
