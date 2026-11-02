import { toCss, type Oklch } from "@/lib/color";

export function GradientPreview({ colors }: { colors: readonly Oklch[] }) {
  return (
    <div
      className="h-24 rounded-xl ring-1 ring-foreground/10"
      style={{
        backgroundImage: `linear-gradient(to right in oklch, ${colors.map(toCss).join(", ")})`,
      }}
    />
  );
}
