import { PREVIEW_API_VERSION, type PreviewDefinition } from "@/lib/previews/contract";

// One budget line per chart color of the theme, so each labels a category.
const lines = [
  ["Design", "12,400", "9,860", 80, 24, "On track"],
  ["Engineering", "48,000", "51,200", 100, 46, "Over"],
  ["Marketing", "18,500", "11,300", 61, 12, "On track"],
  ["Research", "7,200", "6,900", 96, 38, "At risk"],
  ["Support", "9,800", "4,100", 42, 6, "On track"],
] as const;

const statusClass = { "On track": "ok", "At risk": "risk", Over: "over" };

const rows = lines
  .map(
    ([name, budget, spent, used, change, status], index) => `
<tr style="--s: var(--chart-${index + 1})">
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

const emptyRows = `<tr><th></th>${"<td></td>".repeat(6)}</tr>`.repeat(13);

export const spreadsheet: PreviewDefinition = {
  id: "spreadsheet",
  name: "Spreadsheet",
  description: "A budget sheet with categories, data bars, a heat map and status labels.",
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
        <tr class="total"><th></th><td>Total</td><td class="num">$95,900</td><td class="num">$83,360</td><td></td><td></td><td></td></tr>
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
.menu { display: flex; gap: 12px; color: var(--muted-foreground); }
.share {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
  background: var(--primary);
  color: var(--primary-foreground);
}
.formula {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-block: 1px solid var(--border);
  font-family: ui-monospace, Menlo, monospace;
}
.ref { width: 36px; color: var(--muted-foreground); }
.fx { font-style: italic; color: var(--muted-foreground); }
.sheet { flex: 1; overflow: hidden; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; counter-reset: row; }
th, td {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
thead th, tbody th {
  background: var(--muted);
  color: var(--muted-foreground);
  font-weight: 500;
  text-align: center;
}
thead th:first-child { width: 36px; }
thead th:nth-child(2) { width: 22%; }
tbody tr { counter-increment: row; }
tbody th::before { content: counter(row); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.head td { background: var(--secondary); color: var(--secondary-foreground); font-weight: 600; }
.total td { font-weight: 700; border-top: 2px solid var(--foreground); }
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--s);
}
.selected { outline: 2px solid var(--ring); outline-offset: -2px; }
.bar {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: var(--muted);
  overflow: hidden;
}
.bar > span { display: block; width: var(--v); height: 100%; background: var(--s); }
/* At most a 23% wash of the highlight, so the foreground text stays readable. */
.heat { background: color-mix(in srgb, var(--highlight) calc(var(--v) / 2), var(--background)); }
.status { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.status.ok {
  background: color-mix(in srgb, var(--success) 20%, var(--background));
  color: var(--success);
}
.status.risk { background: var(--warning); color: var(--warning-foreground); }
.status.over {
  background: color-mix(in srgb, var(--destructive) 20%, var(--background));
  color: var(--destructive);
}
.tabs { display: flex; gap: 2px; padding: 0 14px; border-top: 1px solid var(--border); background: var(--muted); }
.tab { padding: 8px 14px; color: var(--muted-foreground); }
.tab.active {
  background: var(--background);
  color: var(--foreground);
  font-weight: 600;
  box-shadow: inset 0 2px 0 var(--primary);
}`,
};
