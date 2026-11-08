import { MAX_COLORS } from "@/lib/color";
import { PREVIEW_API_VERSION, type PreviewDefinition } from "@/lib/previews/contract";

// A data series per palette color, the most common way charts use a palette.
const series = [
  "Direct", "Search", "Social", "Email", "Partners",
  "Ads", "Events", "Referral", "Retail", "Other",
].slice(0, MAX_COLORS);

const quarters = ["Q1", "Q2", "Q3", "Q4"];

// Fixed values, so the preview looks the same on every render.
const height = (quarter: number, item: number) =>
  30 + ((quarter * 37 + item * 53 + quarter * item * 11) % 66);

const legend = series
  .map((name, item) => `<span data-color="${item + 1}"><i></i>${name}</span>`)
  .join("");

const groups = quarters
  .map(
    (quarter, index) => `
<div class="group">
  <div class="bars">${series
    .map(
      (_, item) =>
        `<i data-color="${item + 1}" style="--h: ${height(index, item)}%"></i>`,
    )
    .join("")}</div>
  <span class="tick">${quarter}</span>
</div>`,
  )
  .join("");

export const chart: PreviewDefinition = {
  id: "chart",
  name: "Chart",
  description: "A dashboard with one data series per color.",
  apiVersion: PREVIEW_API_VERSION,
  frame: { aspectRatio: "16 / 10", minWidth: 600 },
  html: `
<div class="dash">
  <div class="kpis">
    <div class="kpi"><span class="label">Revenue</span><span class="value">$248k</span><span class="delta">+12.4%</span></div>
    <div class="kpi"><span class="label">Active users</span><span class="value">18.2k</span><span class="delta">+4.1%</span></div>
    <div class="kpi"><span class="label">Churn</span><span class="value">2.1%</span><span class="delta down">−0.3%</span></div>
  </div>
  <div class="card">
    <div class="card-head">
      <span class="card-title">Revenue by channel</span>
      <span class="legend">${legend}</span>
    </div>
    <div class="plot">
      <div class="axis"><span>100k</span><span>75k</span><span>50k</span><span>25k</span><span>0</span></div>
      <div class="groups">${groups}</div>
    </div>
  </div>
</div>`,
  css: `
:root { --line: color-mix(in oklch, var(--fg) 10%, var(--bg)); }
.dash {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: clamp(12px, 3vw, 24px);
  font-size: 12px;
}
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.kpi {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface);
}
.label { grid-column: 1 / -1; color: var(--muted); }
.value { font-size: clamp(18px, 3vw, 24px); font-weight: 700; letter-spacing: -0.02em; }
.delta {
  align-self: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  background: color-mix(in oklch, var(--primary) 18%, var(--bg));
}
.delta.down { background: color-mix(in oklch, var(--accent) 22%, var(--bg)); }
.card {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  border-radius: 12px;
  background: var(--surface);
}
.card-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; }
.card-title { font-size: 14px; font-weight: 600; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 8px; height: 8px; border-radius: 2px; background: var(--c); }
.plot { display: flex; flex: 1; gap: 8px; min-height: 0; }
.axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 20px;
  color: var(--muted);
  font-size: 10px;
  text-align: right;
}
.groups {
  display: flex;
  flex: 1;
  gap: 4%;
  /* Gridlines at each axis label, above the 20px row of ticks. */
  background: repeating-linear-gradient(
    to bottom,
    var(--line) 0 1px,
    transparent 1px 25%
  ) 0 0 / 100% calc(100% - 20px) no-repeat;
}
.group { display: flex; flex: 1; flex-direction: column; }
.bars {
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: 2px;
  border-bottom: 1px solid color-mix(in oklch, var(--fg) 25%, var(--bg));
}
.bars i { flex: 1; height: var(--h); border-radius: 3px 3px 0 0; background: var(--c); }
.tick { height: 20px; padding-top: 4px; color: var(--muted); text-align: center; }`,
};
