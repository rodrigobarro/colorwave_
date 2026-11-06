import type { Metadata } from "next";
import { MyPalettes } from "@/components/my-palettes";

export const metadata: Metadata = {
  title: "My palettes · Colorwave",
};

// The page is static; the list loads in the browser for the signed-in user.
export default function MyPalettesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-16">
      <h2 className="text-2xl font-semibold tracking-tight">My palettes</h2>
      <MyPalettes />
    </main>
  );
}
