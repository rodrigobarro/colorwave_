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
  description: "A product page using the palette's roles.",
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
      <span class="eyebrow">New · Version 2.0</span>
      <h1>Color that works on every screen</h1>
      <p>Build interfaces that stay readable and on brand, from the first sketch to production.</p>
      <div class="actions">
        <span class="btn primary">Start for free</span>
        <span class="btn outline">See how it works</span>
      </div>
    </div>
    <div class="visual" aria-hidden="true">
      <div class="window">
        <div class="window-bar"><i></i><i></i><i></i></div>
        <div class="tiles">${tiles}</div>
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
  border-bottom: 1px solid color-mix(in oklch, var(--fg) 10%, transparent);
}
.logo { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.mark {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
}
.links { display: flex; gap: 20px; margin-left: auto; color: var(--muted); }
.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.btn.small { padding: 7px 12px; font-size: 13px; }
.btn.primary { background: var(--primary); color: var(--on-primary); }
.btn.outline { box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--fg) 20%, transparent); }
.hero { display: flex; align-items: center; gap: 40px; }
.copy { flex: 1.2; display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.eyebrow {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in oklch, var(--accent) 18%, var(--bg));
}
h1 {
  margin: 0;
  font-size: clamp(26px, 5.2vw, 46px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}
p { margin: 0; color: var(--muted); }
.copy > p { max-width: 36ch; font-size: clamp(14px, 1.8vw, 16px); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.visual { flex: 1; }
.window {
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 20px 40px -20px color-mix(in oklch, var(--fg) 40%, transparent);
  overflow: hidden;
}
.window-bar { display: flex; gap: 6px; padding: 10px 12px; }
.window-bar i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: color-mix(in oklch, var(--fg) 20%, transparent);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
  padding: 4px 12px 14px;
}
.tile { aspect-ratio: 1; border-radius: 8px; background: var(--c); }
.features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { padding: 18px; border-radius: 14px; background: var(--surface); }
.card h2 { margin: 12px 0 4px; font-size: 15px; }
.card p { font-size: 13px; }
.icon { display: block; width: 28px; height: 28px; border-radius: 8px; }
.icon.one { background: var(--primary); }
.icon.two { background: var(--accent); }
.icon.three { background: color-mix(in oklch, var(--primary), var(--accent)); }`,
};
