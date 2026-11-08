import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import type { Palette } from "@/lib/palettes";

export type OwnPalette =
  | { status: "loading" }
  | { status: "signed-out" }
  // Doesn't exist or belongs to someone else; the API doesn't say which.
  | { status: "missing" }
  | { status: "failed" }
  | { status: "ready"; palette: Palette };

type Loaded = { key: string; result: OwnPalette };

async function fetchOwnPalette(id: number): Promise<OwnPalette> {
  try {
    const response = await fetch(`/api/palettes/${id}`, { cache: "no-store" });

    if (response.status === 401) return { status: "signed-out" };
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "failed" };

    const palette = await response.json();

    return {
      status: "ready",
      palette: { ...palette, createdAt: new Date(palette.createdAt) },
    };
  } catch {
    return { status: "failed" };
  }
}

// Loads one of the signed-in user's palettes, private ones included, from the
// browser, so it never passes through a cache other visitors share.
export function useOwnPalette(id: number): OwnPalette {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const key = `${userId}:${id}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;

    let isCurrent = true;

    fetchOwnPalette(id).then((result) => {
      if (isCurrent) setLoaded({ key: `${userId}:${id}`, result });
    });

    return () => {
      isCurrent = false;
    };
  }, [userId, id]);

  if (isPending) return { status: "loading" };
  if (!userId) return { status: "signed-out" };

  // Ignores a palette loaded for another account or id.
  return loaded?.key === key ? loaded.result : { status: "loading" };
}
