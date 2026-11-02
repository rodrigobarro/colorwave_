import type { Metadata } from "next";
import { PaletteEditor } from "@/components/palette-editor";

export const metadata: Metadata = {
  title: "Criar paleta · Colorwave",
};

export default function CreatePage() {
  return <PaletteEditor />;
}
