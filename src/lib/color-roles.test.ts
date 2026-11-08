import { describe, expect, it } from "vitest";
import { generateColors, type Oklch } from "@/lib/color";
import { resolveRoles, ROLES } from "@/lib/color-roles";

const white: Oklch = [0.97, 0.01, 90];
const ink: Oklch = [0.2, 0.02, 260];
const blue: Oklch = [0.55, 0.2, 260];
const orange: Oklch = [0.7, 0.17, 50];
const teal: Oklch = [0.6, 0.12, 200];

describe("resolveRoles", () => {
  it("uses the palette's own neutrals for background and text", () => {
    const { scheme, source } = resolveRoles([blue, white, ink, orange]);

    expect(scheme).toBe("light");
    expect(source.bg).toBe(1);
    expect(source.fg).toBe(2);
  });

  it("picks the most saturated color as primary and a distant hue as accent", () => {
    const { source } = resolveRoles([white, teal, blue, orange, ink]);

    expect(source.primary).toBe(2);
    // Teal is close to blue in hue; orange is nearly opposite it.
    expect(source.accent).toBe(3);
  });

  it("derives neutrals when the palette has none", () => {
    const { colors, source } = resolveRoles([blue, orange, teal]);

    expect(source.bg).toBeNull();
    expect(source.fg).toBeNull();
    expect(colors.bg[0]).toBeGreaterThan(0.95);
    expect(colors.fg[0]).toBeLessThan(0.3);
    // Tinted with the strongest hue, and kept close to neutral.
    expect(colors.bg[2]).toBe(blue[2]);
    expect(colors.bg[1]).toBeLessThanOrEqual(0.012);
  });

  it("reads mostly dark palettes as dark interfaces", () => {
    const { scheme, colors, source } = resolveRoles([
      [0.15, 0.02, 280],
      [0.3, 0.1, 280],
      [0.45, 0.15, 300],
      [0.9, 0.03, 80],
    ]);

    expect(scheme).toBe("dark");
    expect(source.bg).toBe(0);
    expect(source.fg).toBe(3);
    expect(colors.surface[0]).toBeGreaterThan(colors.bg[0]);
  });

  it("keeps the main color visible on the background", () => {
    const pale: Oklch = [0.92, 0.2, 100];
    const { colors } = resolveRoles([white, pale, blue]);

    // The pale yellow is more saturated, but nearly as light as the background.
    expect(colors.primary).toEqual(blue);
  });

  it("still gives every role a color with only two colors", () => {
    const { colors, source } = resolveRoles([white, ink]);

    for (const role of ROLES) expect(colors[role]).toHaveLength(3);
    expect(source.primary).not.toBe(source.bg);
  });

  it("works for every generated palette", () => {
    for (const harmony of ["analogous", "triadic"] as const) {
      const colors = generateColors("#3366ff", harmony);
      const { colors: roles } = resolveRoles(colors);

      expect(Math.abs(roles.primary[0] - roles.bg[0])).toBeGreaterThanOrEqual(0.25);
      expect(Math.abs(roles.fg[0] - roles.bg[0])).toBeGreaterThan(0.5);
    }
  });
});
