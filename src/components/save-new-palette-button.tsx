"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { savePalette } from "@/app/create/actions";
import { SignInDialog } from "@/components/sign-in-dialog";
import { authClient } from "@/lib/auth/client";
import { getInitialDraft, saveDraft, type Draft } from "@/lib/draft";

const SAVE_PARAM = "save";

// Saves the draft to the account as a private palette. Publishing it to the
// gallery is a separate step on the palette's page, so nothing goes public by
// accident.
export function SaveNewPaletteButton({
  draft,
  onMissingName,
}: {
  draft: Draft;
  onMissingName: () => void;
}) {
  const router = useRouter();
  const { data: session, isPending: isLoadingSession } =
    authClient.useSession();
  const signInDialog = useRef<HTMLDialogElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function save() {
    if (!draft.name.trim()) {
      onMissingName();
      return;
    }

    if (!session) {
      signInDialog.current?.showModal();
      return;
    }

    startSaving(async () => {
      setSaveError(null);

      const result = await savePalette({
        name: draft.name,
        base: draft.base,
        harmony: draft.harmony,
        colors: draft.colors,
      });

      if (result.error !== undefined) {
        setSaveError(result.error);
        return;
      }

      saveDraft(getInitialDraft());
      router.push(`/palette/${result.id}`);
    });
  }

  const saveAfterSignIn = useEffectEvent(() => {
    const url = new URL(window.location.href);

    if (!url.searchParams.has(SAVE_PARAM)) return;

    // Removed before saving so a reload can't save the palette twice.
    url.searchParams.delete(SAVE_PARAM);
    window.history.replaceState(null, "", url);
    save();
  });

  useEffect(() => {
    if (session) saveAfterSignIn();
  }, [session]);

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
        disabled={isLoadingSession || isSaving}
        onClick={save}
      >
        {isSaving ? "Saving…" : "Save palette"}
      </button>

      <SignInDialog
        ref={signInDialog}
        title="Sign in to save"
        description="Your palette is saved to your account, visible only to you, as soon as you sign in."
        returnTo={`/create?${SAVE_PARAM}=1`}
      />
    </div>
  );
}
