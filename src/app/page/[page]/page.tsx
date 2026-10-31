import { notFound } from "next/navigation";
import { PaletteGallery } from "@/components/palette-gallery";
import { pageCount } from "@/lib/palettes";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return Array.from({ length: pageCount - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export default async function PalettePage({
  params,
}: PageProps<"/page/[page]">) {
  const { page } = await params;
  const number = Number(page);

  if (!Number.isInteger(number) || number < 2 || number > pageCount) {
    notFound();
  }

  return <PaletteGallery page={number} />;
}
