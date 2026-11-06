"use client";

import { useRef, useState, type Ref } from "react";
import { authClient } from "@/lib/auth/client";
import { RETURN_PARAM, SIGNED_IN_PATH } from "@/lib/return-path";

// Only providers enabled in Neon Auth belong here; any other one fails sign-in.
const providers = [{ id: "google", label: "Entrar com Google" }] as const;

const secondaryButtonClassName =
  "rounded-lg px-3 py-2 text-sm ring-1 ring-foreground/15";

export function SignInDialog({
  ref,
  title,
  description,
  returnTo,
}: {
  ref: Ref<HTMLDialogElement>;
  title: string;
  description: string;
  // Where to land after signing in; defaults to the current page.
  returnTo?: string;
}) {
  const [signInError, setSignInError] = useState<string | null>(null);

  async function signIn(provider: (typeof providers)[number]["id"]) {
    setSignInError(null);

    const callbackURL = new URL(SIGNED_IN_PATH, window.location.origin);

    callbackURL.searchParams.set(
      RETURN_PARAM,
      returnTo ?? `${window.location.pathname}${window.location.search}`,
    );

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

  return (
    <dialog
      ref={ref}
      onClose={() => setSignInError(null)}
      className="m-auto w-full max-w-sm rounded-xl bg-background p-6 text-foreground ring-1 ring-foreground/10 backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-foreground/60">{description}</p>
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
        <form method="dialog" className="contents">
          <button className="text-sm text-foreground/60 underline">
            Cancelar
          </button>
        </form>
      </div>
    </dialog>
  );
}

export function SignInButton({
  className,
  title = "Sign in to Colorwave",
  description = "Publish palettes and edit the ones you made.",
  returnTo,
}: {
  className: string;
  title?: string;
  description?: string;
  returnTo?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => dialog.current?.showModal()}
      >
        Sign in
      </button>
      <SignInDialog
        ref={dialog}
        title={title}
        description={description}
        returnTo={returnTo}
      />
    </>
  );
}
