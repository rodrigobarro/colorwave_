"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deletePalette } from "@/app/palette/actions";
import { authClient } from "@/lib/auth/client";

const buttonClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 disabled:opacity-40";

// The page stays static for everyone, so ownership is checked in the browser.
// The server actions check it again; this only decides what to show.
export function PaletteOwnerActions({
  paletteId,
  paletteName,
  authorId,
}: {
  paletteId: number;
  paletteName: string;
  authorId: string | null;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  if (!authorId || session?.user.id !== authorId) return null;

  function confirmDelete() {
    startDeleting(async () => {
      setDeleteError(null);

      const result = await deletePalette(paletteId);

      if (result?.error) {
        setDeleteError(result.error);
        return;
      }

      router.push("/");
    });
  }

  return (
    <div className="flex gap-2">
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

      <dialog
        ref={deleteDialog}
        onClose={() => setDeleteError(null)}
        className="m-auto w-full max-w-sm rounded-xl bg-background p-6 text-foreground ring-1 ring-foreground/10 backdrop:bg-black/50"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Delete “{paletteName}”?
          </h2>
          <p className="text-sm text-foreground/60">
            The palette leaves the gallery for good. This can’t be undone.
          </p>
          {deleteError && (
            <p role="alert" className="text-sm">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonClassName}
              disabled={isDeleting}
              onClick={() => deleteDialog.current?.close()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-40"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? "Deleting…" : "Delete palette"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
