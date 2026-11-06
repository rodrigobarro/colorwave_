import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { GradientPreview } from "@/components/gradient-preview";
import { PaletteOwnerActions } from "@/components/palette-owner-actions";
import { PaletteSwatches } from "@/components/palette-swatches";
import { toCss, toHex } from "@/lib/color";
import { parsePaletteId } from "@/lib/palette-input";
import { getPalette, getPrerenderedPaletteIds } from "@/lib/palettes";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

async function findPalette(params: PageProps<"/palette/[id]">["params"]) {
  const id = parsePaletteId((await params).id);

  return id ? getPalette(id) : null;
}

export async function generateStaticParams() {
  const ids = await getPrerenderedPaletteIds();

  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/palette/[id]">): Promise<Metadata> {
  const palette = await findPalette(params);

  return { title: palette ? `${palette.name} · Colorwave` : "Colorwave" };
}

async function PaletteDetails({
  params,
}: Pick<PageProps<"/palette/[id]">, "params">) {
  const palette = await findPalette(params);

  if (!palette) notFound();

  const { id, name, colors, authorId, authorName, createdAt } = palette;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink href="/">Gallery</BackLink>
        <PaletteOwnerActions
          paletteId={id}
          paletteName={name}
          authorId={authorId}
        />
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="text-sm text-foreground/60">
          {authorName && <>By {authorName} · </>}
          <time dateTime={createdAt.toISOString()}>
            {dateFormat.format(createdAt)}
          </time>
        </p>
      </header>

      <PaletteSwatches colors={colors} className="h-64" />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Colors</h2>
        <ul className="grid gap-x-6 gap-y-2 font-mono text-xs sm:grid-cols-2">
          {colors.map((color, index) => (
            <li key={index} className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-4 shrink-0 rounded ring-1 ring-foreground/10"
                style={{ backgroundColor: toCss(color) }}
              />
              <span className="w-16">{toHex(color)}</span>
              <span className="text-foreground/60">{toCss(color)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Gradient</h2>
        <GradientPreview colors={colors} />
      </section>
    </>
  );
}

export default function PalettePage({ params }: PageProps<"/palette/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 pb-16">
      <Suspense>
        <PaletteDetails params={params} />
      </Suspense>
    </main>
  );
}
