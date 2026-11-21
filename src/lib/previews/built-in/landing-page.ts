import { MAX_COLORS } from "@/lib/color";
import { PREVIEW_API_VERSION, type PreviewDefinition } from "@/lib/previews/contract";

// One tile per palette color; the contract hides the ones past its size.
const tiles = Array.from(
  { length: MAX_COLORS },
  (_, index) => `<i class="tile" data-color="${index + 1}"></i>`,
).join("");

export const landingPage: PreviewDefinition = {
  id: "landing-page",
  name: "Landing page",
  description: "A product page drawn with the palette's theme.",
  apiVersion: PREVIEW_API_VERSION,
  frame: { aspectRatio: "16 / 9", minWidth: 720 },
  html: `
<div class="page">
  <header class="nav">
    <span class="logo"><i class="mark"></i>Lumen</span>
    <span class="links"><span>Product</span><span>Pricing</span><span>Docs</span></span>
    <span class="btn primary small">Get started</span>
  </header>
  <section class="hero">
    <div class="copy">
      <span class="eyebrow"><b>New</b>Version 2.0 is out</span>
      <h1>Color that works on every screen</h1>
      <p>Build interfaces that stay readable and on brand, from the first sketch to production.</p>
      <div class="actions">
        <span class="btn primary">Start for free</span>
        <span class="btn outline">See how it works</span>
      </div>
      <span class="note"><i class="check"></i>Free for 14 days, no card needed</span>
    </div>
    <div class="visual" aria-hidden="true">
      <div class="window">
        <div class="window-bar"><i></i><i></i><i></i></div>
        <div class="tiles">${tiles}</div>
        <div class="toast"><i class="check"></i>Theme exported</div>
      </div>
    </div>
  </section>
  <section class="features">
    <article class="card"><i class="icon one"></i><h2>Consistent</h2><p>One palette, every product surface.</p></article>
    <article class="card"><i class="icon two"></i><h2>Accessible</h2><p>Text that stays readable on each color.</p></article>
    <article class="card"><i class="icon three"></i><h2>Fast</h2><p>Ship a theme in minutes, not weeks.</p></article>
  </section>
</div>`,
  css: `
.page {
  display: flex;
  flex-direction: column;
  gap: clamp(20px, 5vw, 40px);
  height: 100%;
  padding: 0 clamp(16px, 5vw, 48px);
}
.nav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.logo { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.mark {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--primary), var(--highlight));
}
.links { display: flex; gap: 20px; margin-left: auto; color: var(--muted-foreground); }
.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.btn.small { padding: 7px 12px; font-size: 13px; }
.btn.primary { background: var(--primary); color: var(--primary-foreground); }
.btn.outline { box-shadow: inset 0 0 0 1px var(--input); }
.hero { display: flex; align-items: center; gap: 40px; }
.copy { flex: 1.2; display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in srgb, var(--highlight) 20%, var(--background));
  color: var(--highlight);
}
.eyebrow b {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--highlight);
  color: var(--highlight-foreground);
}
h1 {
  margin: 0;
  font-size: clamp(26px, 5.2vw, 46px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}
p { margin: 0; color: var(--muted-foreground); }
.copy > p { max-width: 36ch; font-size: clamp(14px, 1.8vw, 16px); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.note { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--success); }
.check {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--success);
}
.visual { flex: 1; }
.window {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  box-shadow: 0 20px 40px -20px color-mix(in oklch, var(--foreground) 40%, transparent);
}
.window-bar { display: flex; gap: 6px; padding: 10px 12px; }
.window-bar i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
  padding: 4px 12px 14px;
}
.tile { aspect-ratio: 1; border-radius: 8px; background: var(--c); }
.toast {
  position: absolute;
  right: -12px;
  bottom: -16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--popover);
  color: var(--popover-foreground);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 10px 24px -12px color-mix(in oklch, var(--foreground) 50%, transparent);
}
.features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  color: var(--card-foreground);
}
.card h2 { margin: 12px 0 4px; font-size: 15px; }
.card p { font-size: 13px; }
.icon { display: block; width: 28px; height: 28px; border-radius: 8px; }
.icon.one { background: var(--primary); }
.icon.two { background: var(--highlight); }
.icon.three { background: var(--chart-3); }`,
};
