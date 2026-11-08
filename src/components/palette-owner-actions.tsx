"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type RefObject } from "react";
import { deletePalette, setPaletteVisibility } from "@/app/palette/actions";
import { authClient } from "@/lib/auth/client";
import type { Visibility } from "@/lib/visibility";

const buttonClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 disabled:opacity-40";
const primaryButtonClassName =
  "rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-40";

type Result = { error?: string } | undefined;

function ConfirmDialog({
  ref,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => Promise<Result>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      setError(null);

      const result = await onConfirm();

      if (result?.error) setError(result.error);
      else ref.current?.close();
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={() => setError(null)}
      className="m-auto w-full max-w-sm rounded-xl bg-background p-6 text-foreground ring-1 ring-foreground/10 backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-foreground/60">{description}</p>
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={buttonClassName}
            disabled={isPending}
            onClick={() => ref.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={isPending}
            onClick={confirm}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// Public pages stay static for everyone, so ownership is checked in the
// browser. The server actions check it again; this only decides what to show.
export function PaletteOwnerActions({
  paletteId,
  paletteName,
  authorId,
  visibility,
}: {
  paletteId: number;
  paletteName: string;
  authorId: string | null;
  visibility: Visibility;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const unpublishDialog = useRef<HTMLDialogElement>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, startPublishing] = useTransition();

  if (!authorId || session?.user.id !== authorId) return null;

  // Publishing is the deliberate step out of private, so the button names
  // exactly what happens and needs no confirmation.
  function publish() {
    startPublishing(async () => {
      setPublishError(null);

      const result = await setPaletteVisibility(paletteId, "public");

      if (result?.error) setPublishError(result.error);
      else router.refresh();
    });
  }

  async function unpublish() {
    const result = await setPaletteVisibility(paletteId, "private");

    if (!result?.error) router.refresh();

    return result;
  }

  async function remove() {
    const result = await deletePalette(paletteId);

    if (!result?.error) router.push(visibility === "private" ? "/me" : "/");

    return result;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {publishError && (
        <p role="alert" className="text-sm">
          {publishError}
        </p>
      )}
      <Link href={`/palette/${paletteId}/edit`} className={buttonClassName}>
        Edit
      </Link>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => deleteDialog.current?.showModal()}
      >
        Delete
      </button>
      {visibility === "private" ? (
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={isPublishing}
          onClick={publish}
        >
          {isPublishing ? "Publishing…" : "Publish to gallery"}
        </button>
      ) : (
        <button
          type="button"
          className={buttonClassName}
          onClick={() => unpublishDialog.current?.showModal()}
        >
          Make private
        </button>
      )}

      <ConfirmDialog
        ref={unpublishDialog}
        title={`Make “${paletteName}” private?`}
        description="It leaves the gallery and only you will see it. People who already saw it may have copied its colors."
        confirmLabel="Make private"
        pendingLabel="Making private…"
        onConfirm={unpublish}
      />
      <ConfirmDialog
        ref={deleteDialog}
        title={`Delete “${paletteName}”?`}
        description={
          visibility === "private"
            ? "The palette is removed from your account for good. This can’t be undone."
            : "The palette leaves the gallery for good. This can’t be undone."
        }
        confirmLabel="Delete palette"
        pendingLabel="Deleting…"
        onConfirm={remove}
      />
    </div>
  );
}
