"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePalette } from "@/app/palette/actions";
import { PaletteEditor } from "@/components/palette-editor";
import { SignInButton } from "@/components/sign-in-dialog";
import { isHarmony, isHexColor, toHex } from "@/lib/color";
import type { Draft } from "@/lib/draft";
import type { Palette } from "@/lib/palettes";
import { useOwnPalette } from "@/lib/use-own-palette";

type EditablePalette = Pick<
  Palette,
  "id" | "name" | "colors" | "base" | "harmony"
>;

// Seed palettes have no base or harmony, so the editor starts from the first
// color. The stored colors still win, as manual adjustments.
function toDraft({ name, colors, base, harmony }: EditablePalette): Draft {
  return {
    name,
    colors,
    base: isHexColor(base) ? base : toHex(colors[0]).toLowerCase(),
    harmony: isHarmony(harmony) ? harmony : "analogous",
  };
}

function SaveButton({
  paletteId,
  draft,
  onMissingName,
}: {
  paletteId: number;
  draft: Draft;
  onMissingName: () => void;
}) {
  const router = useRouter();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function save() {
    if (!draft.name.trim()) {
      onMissingName();
      return;
    }

    startSaving(async () => {
      setSaveError(null);

      const result = await updatePalette(paletteId, {
        name: draft.name,
        base: draft.base,
        harmony: draft.harmony,
        colors: draft.colors,
      });

      if (result?.error) {
        setSaveError(result.error);
        return;
      }

      router.push(`/palette/${paletteId}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      {saveError && (
        <p role="alert" className="text-sm">
          {saveError}
        </p>
      )}
      <button
        type="button"
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        disabled={isSaving}
        onClick={save}
      >
        {isSaving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function CannotEdit({ paletteId, signedOut, failed }: {
  paletteId: number;
  signedOut: boolean;
  failed: boolean;
}) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start gap-4 px-6 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {failed ? "Couldn’t load this palette" : "You can only edit your own palettes"}
      </h1>
      <p className="text-sm text-foreground/60">
        {failed
          ? "Reload the page to try again."
          : signedOut
            ? "Sign in with the account that saved this palette."
            : "This palette doesn’t exist or isn’t yours."}
      </p>
      <div className="flex items-center gap-4">
        {signedOut && (
          <SignInButton
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15"
            title="Sign in to edit"
            description="Use the account that saved this palette."
          />
        )}
        <Link
          href={`/palette/${paletteId}`}
          className="text-sm font-medium underline"
        >
          Back to the palette
        </Link>
      </div>
    </main>
  );
}

// Edits stay in memory, so they never overwrite the new-palette draft.
function Editor({ palette }: { palette: EditablePalette }) {
  const [draft, setDraft] = useState(() => toDraft(palette));

  return (
    <PaletteEditor
      draft={draft}
      onChange={setDraft}
      backHref={`/palette/${palette.id}`}
      renderAction={(requireName) => (
        <SaveButton
          paletteId={palette.id}
          draft={draft}
          onMissingName={requireName}
        />
      )}
    />
  );
}

// Loaded in the browser with the author's session, never rendered on the
// server, so a private palette's colors can't reach anyone else.
export function EditPalette({ paletteId }: { paletteId: number }) {
  const own = useOwnPalette(paletteId);

  if (own.status === "loading") return <main className="flex-1" />;

  if (own.status !== "ready") {
    return (
      <CannotEdit
        paletteId={paletteId}
        signedOut={own.status === "signed-out"}
        failed={own.status === "failed"}
      />
    );
  }

  return <Editor palette={own.palette} />;
}
