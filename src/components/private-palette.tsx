"use client";

import { BackLink } from "@/components/back-link";
import { PaletteSkeleton, PaletteView } from "@/components/palette-view";
import { SignInButton } from "@/components/sign-in-dialog";
import { useOwnPalette } from "@/lib/use-own-palette";

// The cached page found no public palette at this id. It may be the visitor's
// own private one, so it is loaded here, in their browser, with their session.
// Anyone else gets the same message whether the id exists or not.
export function PrivatePalette({ paletteId }: { paletteId: number }) {
  const own = useOwnPalette(paletteId);

  if (own.status === "loading") return <PaletteSkeleton />;

  if (own.status === "ready") {
    return (
      <>
        <title>{`${own.palette.name} · Colorwave`}</title>
        <PaletteView palette={own.palette} />
      </>
    );
  }

  return (
    <>
      <div className="flex">
        <BackLink href="/">Gallery</BackLink>
      </div>
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          This palette isn’t available
        </h1>
        <p className="text-sm text-foreground/60">
          {own.status === "failed"
            ? "Couldn’t load this palette. Reload the page to try again."
            : "It doesn’t exist, or it’s private."}
        </p>
        {own.status === "signed-out" && (
          <>
            <p className="text-sm text-foreground/60">
              If it’s yours, sign in to see it.
            </p>
            <SignInButton
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15"
              title="Sign in to see this palette"
              description="Use the account that saved it."
            />
          </>
        )}
      </div>
    </>
  );
}
