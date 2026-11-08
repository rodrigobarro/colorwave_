import { MAX_COLORS } from "@/lib/color";
import { PREVIEW_API_VERSION, type PreviewDefinition } from "@/lib/previews/contract";

// One budget line per palette color, so each color labels a category.
const lines = [
  ["Design", "12,400", "9,860", 80, 24, "On track"],
  ["Engineering", "48,000", "51,200", 100, 46, "Over"],
  ["Marketing", "18,500", "11,300", 61, 12, "On track"],
  ["Research", "7,200", "6,900", 96, 38, "At risk"],
  ["Support", "9,800", "4,100", 42, 6, "On track"],
  ["Sales", "22,000", "19,700", 90, 30, "At risk"],
  ["Operations", "14,300", "8,800", 62, 16, "On track"],
  ["Legal", "5,600", "5,900", 100, 42, "Over"],
  ["Hiring", "11,000", "3,200", 29, 4, "On track"],
  ["Travel", "4,500", "2,700", 60, 10, "On track"],
] as const;

const statusClass = { "On track": "ok", "At risk": "risk", Over: "over" };

const rows = lines
  .slice(0, MAX_COLORS)
  .map(
    ([name, budget, spent, used, change, status], index) => `
<tr data-color="${index + 1}">
  <th></th>
  <td><i class="dot"></i>${name}</td>
  <td class="num">$${budget}</td>
  <td class="num${index === 1 ? " selected" : ""}">$${spent}</td>
  <td><span class="bar"><span style="--v: ${used}%"></span></span></td>
  <td class="num heat" style="--v: ${change}%">+${Math.round(change / 4)}%</td>
  <td><span class="status ${statusClass[status]}">${status}</span></td>
</tr>`,
  )
  .join("");

const emptyRows = `<tr><th></th>${"<td></td>".repeat(6)}</tr>`.repeat(8);

export const spreadsheet: PreviewDefinition = {
  id: "spreadsheet",
  name: "Spreadsheet",
  description: "A budget sheet with categories, data bars and a heat map.",
  apiVersion: PREVIEW_API_VERSION,
  frame: { aspectRatio: "16 / 10", minWidth: 640 },
  html: `
<div class="app">
  <div class="toolbar">
    <i class="doc"></i>
    <span class="title">Q3 budget</span>
    <span class="menu"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span></span>
    <span class="share">Share</span>
  </div>
  <div class="formula"><span class="ref">D3</span><span class="fx">fx</span><span>=SUM(Payroll!B2:B14)</span></div>
  <div class="sheet">
    <table>
      <thead>
        <tr><th class="corner"></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr>
      </thead>
      <tbody>
        <tr class="head"><th></th><td>Category</td><td class="num">Budget</td><td class="num">Spent</td><td>Used</td><td class="num">Change</td><td>Status</td></tr>
        ${rows}
        <tr class="total"><th></th><td>Total</td><td class="num">$153,300</td><td class="num">$123,660</td><td></td><td></td><td></td></tr>
        ${emptyRows}
      </tbody>
    </table>
  </div>
  <div class="tabs"><span class="tab active">Budget</span><span class="tab">Forecast</span><span class="tab">Payroll</span></div>
</div>`,
  css: `
.app { display: flex; flex-direction: column; height: 100%; font-size: 12px; }
.toolbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.doc { width: 16px; height: 20px; border-radius: 3px; background: var(--primary); }
.title { font-size: 14px; font-weight: 600; }
.menu { display: flex; gap: 12px; color: var(--muted); }
.share {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
  background: var(--primary);
  color: var(--on-primary);
}
.formula {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-block: 1px solid var(--line);
  font-family: ui-monospace, Menlo, monospace;
}
.ref { width: 36px; color: var(--muted); }
.fx { font-style: italic; color: var(--muted); }
.sheet { flex: 1; overflow: hidden; }
:root { --line: color-mix(in oklch, var(--fg) 12%, var(--bg)); }
table { width: 100%; border-collapse: collapse; table-layout: fixed; counter-reset: row; }
th, td {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--line);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
thead th, tbody th {
  background: var(--surface);
  color: var(--muted);
  font-weight: 500;
  text-align: center;
}
thead th:first-child { width: 36px; }
thead th:nth-child(2) { width: 22%; }
tbody tr { counter-increment: row; }
tbody th::before { content: counter(row); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.head td { background: var(--primary); color: var(--on-primary); font-weight: 600; }
.total td { font-weight: 700; border-top: 2px solid var(--fg); }
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--c);
}
.selected { outline: 2px solid var(--primary); outline-offset: -2px; }
.bar {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--fg) 8%, var(--bg));
  overflow: hidden;
}
.bar > span { display: block; width: var(--v); height: 100%; background: var(--c); }
.heat { background: color-mix(in oklch, var(--accent) var(--v), var(--bg)); }
.status { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.status.ok { background: color-mix(in oklch, var(--primary) 18%, var(--bg)); }
.status.risk { background: color-mix(in oklch, var(--accent) 28%, var(--bg)); }
.status.over { background: var(--fg); color: var(--bg); }
.tabs { display: flex; gap: 2px; padding: 0 14px; border-top: 1px solid var(--line); background: var(--surface); }
.tab { padding: 8px 14px; color: var(--muted); }
.tab.active {
  background: var(--bg);
  color: var(--fg);
  font-weight: 600;
  box-shadow: inset 0 2px 0 var(--primary);
}`,
};
