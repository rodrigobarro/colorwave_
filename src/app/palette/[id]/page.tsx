import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaletteSkeleton, PaletteView } from "@/components/palette-view";
import { PrivatePalette } from "@/components/private-palette";
import { parsePaletteId } from "@/lib/palette-input";
import { getPalette, getPrerenderedPaletteIds } from "@/lib/palettes";

async function findPalette(params: PageProps<"/palette/[id]">["params"]) {
  const id = parsePaletteId((await params).id);

  return { id, palette: id ? await getPalette(id) : null };
}

export async function generateStaticParams() {
  const ids = await getPrerenderedPaletteIds();

  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/palette/[id]">): Promise<Metadata> {
  const { palette } = await findPalette(params);

  // A private palette sets its own title in the browser; search engines only
  // ever see the public ones.
  return palette
    ? { title: `${palette.name} · Colorwave` }
    : { title: "Colorwave", robots: { index: false } };
}

async function PaletteDetails({
  params,
}: Pick<PageProps<"/palette/[id]">, "params">) {
  const { id, palette } = await findPalette(params);

  if (!id) notFound();

  // The page is cached for everyone, so it only holds public palettes. Any
  // other id may be the visitor's private palette, checked in their browser.
  if (!palette) return <PrivatePalette paletteId={id} />;

  return <PaletteView palette={palette} />;
}

export default function PalettePage({ params }: PageProps<"/palette/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 pb-16">
      <Suspense fallback={<PaletteSkeleton />}>
        <PaletteDetails params={params} />
      </Suspense>
    </main>
  );
}
