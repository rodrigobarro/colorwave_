import type { Metadata } from "next";
import Link from "next/link";
import { MyPalettes } from "@/components/my-palettes";

export const metadata: Metadata = {
  title: "My palettes · Colorwave",
};

// The page is static; the list loads in the browser for the signed-in user.
export default function MyPalettesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-16">
      {/* Saved palettes start private, so this is where people work on
          theirs; starting a new one is the page's main action. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">My palettes</h2>
        <Link
          href="/create"
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
        >
          New palette
        </Link>
      </div>
      <MyPalettes />
    </main>
  );
}
