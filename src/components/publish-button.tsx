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
import { authClient } from "@/lib/auth/client";
import { getInitialDraft, saveDraft, type Draft } from "@/lib/draft";

const PUBLISH_PARAM = "publish";

// Only providers enabled in Neon Auth belong here; any other one fails sign-in.
const providers = [{ id: "google", label: "Entrar com Google" }] as const;

const secondaryButtonClassName =
  "rounded-lg px-3 py-2 text-sm ring-1 ring-foreground/15";

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
  const [signInError, setSignInError] = useState<string | null>(null);
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

  async function signIn(provider: (typeof providers)[number]["id"]) {
    setSignInError(null);

    const callbackURL = new URL("/create", window.location.origin);

    callbackURL.searchParams.set(PUBLISH_PARAM, "1");

    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: callbackURL.href,
      });

      if (error) throw error;
    } catch {
      setSignInError("Não foi possível entrar. Tente novamente.");
    }
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
      {session && (
        <p className="flex gap-2 text-xs text-foreground/60">
          {session.user.name}
          <button
            type="button"
            className="underline"
            onClick={() => authClient.signOut()}
          >
            Sair
          </button>
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

      <dialog
        ref={signInDialog}
        onClose={() => setSignInError(null)}
        className="m-auto w-full max-w-sm rounded-xl bg-background p-6 text-foreground ring-1 ring-foreground/10 backdrop:bg-black/50"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Entre para publicar
          </h2>
          <p className="text-sm text-foreground/60">
            Sua paleta será publicada assim que você entrar.
          </p>
          {providers.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={secondaryButtonClassName}
              onClick={() => signIn(id)}
            >
              {label}
            </button>
          ))}
          {signInError && (
            <p role="alert" className="text-sm">
              {signInError}
            </p>
          )}
          <button
            type="button"
            className="text-sm text-foreground/60 underline"
            onClick={() => signInDialog.current?.close()}
          >
            Cancelar
          </button>
        </div>
      </dialog>
    </div>
  );
}
