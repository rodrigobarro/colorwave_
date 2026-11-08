"use client";

import { useEffect, useState } from "react";
import { PaletteCard } from "@/components/palette-card";
import { SignInButton } from "@/components/sign-in-dialog";
import { authClient } from "@/lib/auth/client";
import type { PaletteSummary } from "@/lib/palettes";

type Loaded =
  | { userId: string; palettes: PaletteSummary[] }
  | { userId: string; failed: true };

const buttonClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15";

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 text-sm text-foreground/60">
      {children}
    </div>
  );
}

export function MyPalettes() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;

    let isCurrent = true;

    fetch("/api/palettes/mine")
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));

        return response.json() as Promise<PaletteSummary[]>;
      })
      .then((palettes) => {
        if (isCurrent) setLoaded({ userId, palettes });
      })
      .catch(() => {
        if (isCurrent) setLoaded({ userId, failed: true });
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Ignores a list loaded for an account that has since signed out.
  const result = loaded?.userId === userId ? loaded : null;

  if (isPending) return null;

  if (!session) {
    return (
      <Message>
        <p>Sign in to see the palettes you saved.</p>
        <SignInButton className={buttonClassName} />
      </Message>
    );
  }

  if (!result) return <Message>Loading your palettes…</Message>;

  if ("failed" in result) {
    return (
      <Message>Couldn’t load your palettes. Reload the page to try again.</Message>
    );
  }

  if (result.palettes.length === 0) {
    // The page header's "New palette" is the way to start one.
    return <Message>You haven’t saved any palettes yet.</Message>;
  }

  return (
    <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {result.palettes.map((palette) => (
        <li key={palette.id}>
          <PaletteCard palette={palette} />
        </li>
      ))}
    </ul>
  );
}
