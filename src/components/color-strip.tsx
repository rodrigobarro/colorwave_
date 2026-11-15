import { toCss, type Oklch } from "@/lib/color";

export function ColorStrip({ colors }: { colors: readonly Oklch[] }) {
  return (
    // The segments are empty, so a browser that doesn't stretch this strip
    // inside the harmony buttons (iOS WebKit) collapses it to 0 without w-full.
    <span aria-hidden className="flex h-8 w-full overflow-hidden rounded-md">
      {colors.map((color, index) => (
        <span
          key={index}
          className="flex-1"
          style={{ backgroundColor: toCss(color) }}
        />
      ))}
    </span>
  );
}
