"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePalette } from "@/app/palette/actions";
import { PaletteEditor } from "@/components/palette-editor";
import { authClient } from "@/lib/auth/client";
import { isHarmony, isHexColor, toHex } from "@/lib/color";
import type { Draft } from "@/lib/draft";
import type { Palette } from "@/lib/palettes";

type EditablePalette = Pick<
  Palette,
  "id" | "name" | "colors" | "base" | "harmony" | "authorId"
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

// Edits stay in memory, so they never overwrite the new-palette draft.
export function EditPalette({ palette }: { palette: EditablePalette }) {
  const { data: session, isPending } = authClient.useSession();
  const [draft, setDraft] = useState(() => toDraft(palette));

  if (isPending) return <main className="flex-1" />;

  if (!palette.authorId || session?.user.id !== palette.authorId) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start gap-4 px-6 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          You can only edit your own palettes
        </h1>
        <p className="text-sm text-foreground/60">
          {session
            ? "This palette was published by someone else."
            : "Sign in with the account that published this palette."}
        </p>
        <Link
          href={`/palette/${palette.id}`}
          className="text-sm font-medium underline"
        >
          Back to the palette
        </Link>
      </main>
    );
  }

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
