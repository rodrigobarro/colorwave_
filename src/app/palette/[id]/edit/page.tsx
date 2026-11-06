import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditPalette } from "@/components/edit-palette";
import { parsePaletteId } from "@/lib/palette-input";
import { getPalette } from "@/lib/palettes";

export const metadata: Metadata = {
  title: "Edit palette · Colorwave",
};

async function PaletteToEdit({
  params,
}: Pick<PageProps<"/palette/[id]/edit">, "params">) {
  const id = parsePaletteId((await params).id);
  const palette = id ? await getPalette(id) : null;

  if (!palette) notFound();

  const { name, colors, base, harmony, authorId } = palette;

  return (
    <EditPalette palette={{ id: palette.id, name, colors, base, harmony, authorId }} />
  );
}

export default function EditPalettePage({
  params,
}: PageProps<"/palette/[id]/edit">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <PaletteToEdit params={params} />
    </Suspense>
  );
}
