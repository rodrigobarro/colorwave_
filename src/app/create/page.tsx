import type { Metadata } from "next";
import { CreatePalette } from "@/components/create-palette";

export const metadata: Metadata = {
  title: "Criar paleta · Colorwave",
};

export default function CreatePage() {
  return <CreatePalette />;
}
