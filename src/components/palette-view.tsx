import { BackLink } from "@/components/back-link";
import { PaletteOwnerActions } from "@/components/palette-owner-actions";
import { PalettePreviews } from "@/components/palette-previews";
import { PaletteSwatches } from "@/components/palette-swatches";
import { toCss, toHex } from "@/lib/color";
import type { Palette } from "@/lib/palettes";

// Rendered on the server for public palettes and in the browser for the
// author's private ones, so it has no "use client" and reads no server data.

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// The swatches keep a 2:1 shape as the page narrows, so on a phone they don't
// turn into a near-square block, and stop growing at 16rem on wider screens.
// Shared with the skeleton so the two always match.
const swatchesSize = "aspect-[2/1] max-h-64";

export type PaletteViewData = Pick<
  Palette,
  "id" | "name" | "colors" | "visibility" | "authorId" | "authorName" | "createdAt"
>;

export function PaletteView({ palette }: { palette: PaletteViewData }) {
  const { id, name, colors, visibility, authorId, authorName, createdAt } =
    palette;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink href={visibility === "private" ? "/me" : "/"}>
          {visibility === "private" ? "My palettes" : "Gallery"}
        </BackLink>
        <PaletteOwnerActions
          paletteId={id}
          paletteName={name}
          authorId={authorId}
          visibility={visibility}
        />
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="text-sm text-foreground/60">
          {visibility === "private" ? (
            <>Private · only you can see it · </>
          ) : (
            authorName && <>By {authorName} · </>
          )}
          <time dateTime={createdAt.toISOString()}>
            {dateFormat.format(createdAt)}
          </time>
        </p>
      </header>

      <PaletteSwatches colors={colors} className={swatchesSize} />

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

      <PalettePreviews colors={colors} paletteName={name} />
    </>
  );
}

const skeletonBlock = "rounded-md bg-foreground/10";

// Part of the App Shell, so it is prefetched with every palette link and shows
// the moment one is clicked. It mirrors the page's layout so the content
// replaces it without moving anything.
export function PaletteSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        Loading palette…
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink href="/">Gallery</BackLink>
      </div>

      <div
        aria-hidden
        className="flex animate-pulse flex-col gap-8 motion-reduce:animate-none"
      >
        <div className="flex flex-col gap-1">
          <div className={`h-8 w-56 ${skeletonBlock}`} />
          <div className={`h-5 w-40 ${skeletonBlock}`} />
        </div>

        <div className={`rounded-xl bg-foreground/10 ${swatchesSize}`} />

        <div className="flex flex-col gap-3">
          <div className={`h-5 w-14 ${skeletonBlock}`} />
          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="flex h-4 items-center gap-3">
                <span className={`size-4 shrink-0 ${skeletonBlock}`} />
                <span className={`h-3 w-48 ${skeletonBlock}`} />
              </li>
            ))}
          </ul>
        </div>

        {/* The previews heading and the first preview, the gradient. */}
        <div className="flex flex-col gap-6">
          <div className={`h-5 w-16 ${skeletonBlock}`} />
          <div className="h-24 rounded-xl bg-foreground/10" />
        </div>
      </div>
    </>
  );
}
