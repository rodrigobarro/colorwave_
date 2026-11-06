"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { publishPalette } from "@/app/create/actions";
import { SignInDialog } from "@/components/sign-in-dialog";
import { authClient } from "@/lib/auth/client";
import { getInitialDraft, saveDraft, type Draft } from "@/lib/draft";

const PUBLISH_PARAM = "publish";

export function PublishButton({
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
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, startPublishing] = useTransition();

  function publish() {
    if (!draft.name.trim()) {
      onMissingName();
      return;
    }

    if (!session) {
      signInDialog.current?.showModal();
      return;
    }

    startPublishing(async () => {
      setPublishError(null);

      const result = await publishPalette({
        name: draft.name,
        base: draft.base,
        harmony: draft.harmony,
        colors: draft.colors,
      });

      if (result.error !== undefined) {
        setPublishError(result.error);
        return;
      }

      saveDraft(getInitialDraft());
      router.push(`/palette/${result.id}`);
    });
  }

  const publishAfterSignIn = useEffectEvent(() => {
    const url = new URL(window.location.href);

    if (!url.searchParams.has(PUBLISH_PARAM)) return;

    // Removed before publishing so a reload can't publish the palette twice.
    url.searchParams.delete(PUBLISH_PARAM);
    window.history.replaceState(null, "", url);
    publish();
  });

  useEffect(() => {
    if (session) publishAfterSignIn();
  }, [session]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      {publishError && (
        <p role="alert" className="text-sm">
          {publishError}
        </p>
      )}
      <button
        type="button"
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        disabled={isLoadingSession || isPublishing}
        onClick={publish}
      >
        {isPublishing ? "Publicando…" : "Publicar paleta"}
      </button>

      <SignInDialog
        ref={signInDialog}
        title="Entre para publicar"
        description="Sua paleta será publicada assim que você entrar."
        returnTo={`/create?${PUBLISH_PARAM}=1`}
      />
    </div>
  );
}
