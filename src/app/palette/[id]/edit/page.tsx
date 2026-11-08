import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditPalette } from "@/components/edit-palette";
import { parsePaletteId } from "@/lib/palette-input";

export const metadata: Metadata = {
  title: "Edit palette · Colorwave",
  robots: { index: false },
};

async function PaletteToEdit({
  params,
}: Pick<PageProps<"/palette/[id]/edit">, "params">) {
  const id = parsePaletteId((await params).id);

  if (!id) notFound();

  // Only the author can edit, and the palette may be private, so its data is
  // loaded in the browser with their session instead of rendered here.
  return <EditPalette paletteId={id} />;
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
