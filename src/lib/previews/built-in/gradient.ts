import { PREVIEW_API_VERSION, type PreviewDefinition } from "@/lib/previews/contract";

export const gradient: PreviewDefinition = {
  id: "gradient",
  name: "Gradient",
  description: "The colors blended in order, through OKLCH.",
  apiVersion: PREVIEW_API_VERSION,
  frame: { height: 96 },
  html: `<div class="gradient"></div>`,
  css: `
.gradient {
  height: 100%;
  background-image: linear-gradient(to right in oklch, var(--colors));
}`,
};
