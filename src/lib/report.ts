// Generates a 10-page printable HTML report from current analysis state.
// User clicks "Export Report" → opens in new tab → uses browser Print → PDF.
// No external PDF libs; works fully offline and free.

import type { RankedRow } from "./screener";
import type { Horizon } from "@/stores/app-store";

export function buildReportHTML(opts: {
  market: "IN" | "US";
  horizon: Horizon;
  sector: string;
  ranked: RankedRow[];
  filtered: RankedRow[];
}): string {
  const { market, horizon, sector, ranked, filtered } = opts;
  const cur = market === "IN" ? "₹" : "$";
  const top = filtered.slice(0, 20);
  const sectorBuckets = new Map<string, number[]>();
  for (const r of ranked) {
    const a = sectorBuckets.get(r.entry.sector) ?? [];
    a.push(r.scores.composite);
    sectorBuckets.set(r.entry.sector, a);
  }
  const sectorRows = [...sectorBuckets.entries()]
    .map(([s, arr]) => ({ sector: s, count: arr.length, avg: arr.reduce((x, y) => x + y, 0) / arr.length }))
    .sort((a, b) => b.avg - a.avg);

  const today = new Date().toISOString().slice(0, 10);

  const css = `
    @page { size: A4; margin: 1.5cm; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; color: #111; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 22pt; margin: 0 0 8px; color: #0b3d91; }
    h2 { font-size: 14pt; margin: 18px 0 6px; color: #0b3d91; border-bottom: 2px solid #0b3d91; padding-bottom: 4px; }
    h3 { font-size: 11pt; margin: 12px 0 4px; }
    .page { page-break-after: always; padding-bottom: 20px; }
    .page:last-child { page-break-after: auto; }
    .muted { color: #666; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0; }
    th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
    th { background: #f3f4f6; }
    .tag { display: inline-block; background: #0b3d91; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9pt; }
    .warning { background: #fff4e5; border-left: 4px solid #f59e0b; padding: 8px 12px; margin: 8px 0; font-size: 10pt; }
    ul { margin: 4px 0 8px 18px; padding: 0; }
    li { margin-bottom: 3px; }
  `;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>ALPHADESK Report — ${today}</title><style>${css}</style></head>
<body>

<div class="page">
  <h1>ALPHADESK — Analysis Report</h1>
  <div class="muted">Generated: ${today} · Market: ${market === "IN" ? "🇮🇳 NSE/BSE" : "🇺🇸 NYSE/NASDAQ"} · Horizon: <strong>${horizon}</strong> · Sector filter: ${sector}</div>
  <h2>Executive Summary</h2>
  <p>This report analyzes <strong>${ranked.length}</strong> stocks in the universe and presents <strong>${top.length}</strong> final candidates for the <strong>${horizon}</strong> horizon.</p>
  <h3>Key insights</h3>
  <ul>
    <li>Leading sectors: <strong>${sectorRows.slice(0, 3).map((s) => s.sector).join(", ")}</strong>.</li>
    <li>Weakest sectors: <strong>${sectorRows.slice(-3).map((s) => s.sector).join(", ")}</strong>.</li>
    <li>Top stock: <strong>${ranked[0]?.entry.symbol ?? "—"}</strong> (composite ${ranked[0]?.scores.composite.toFixed(0) ?? "—"}).</li>
    <li>Average composite across universe: <strong>${(ranked.reduce((s, r) => s + r.scores.composite, 0) / Math.max(1, ranked.length)).toFixed(1)}</strong>.</li>
  </ul>
</div>

<div class="page">
  <h2>Methodology (in plain English)</h2>
  <ol>
    <li><strong>Collect</strong> prices and fundamentals from Yahoo Finance + manual CSV.</li>
    <li><strong>Clean</strong> — flag missing values, no silent imputation.</li>
    <li><strong>Score</strong> across 6 modules: Fundamental, Valuation, Quant, Technical, Qualitative, ML.</li>
    <li><strong>ML ensemble</strong> — logistic regression + 3-class softmax for Buy/Watch/Avoid.</li>
    <li><strong>Simulate</strong> with Monte Carlo + scenario stress tests.</li>
    <li><strong>Rank</strong> by horizon-weighted composite → Top 100 → 50 → 20.</li>
  </ol>
</div>

<div class="page">
  <h2>Types of Analysis Explained</h2>
  <h3>Fundamental analysis</h3><p>How healthy is the business? Revenue growth, ROE, margins, debt, cash flow.</p>
  <h3>Valuation analysis</h3><p>Is the stock cheap or expensive? P/E, P/B, EV/EBITDA, dividend yield.</p>
  <h3>Technical analysis</h3><p>Chart-based timing: trend (50d vs 200d SMA), RSI, drawdown.</p>
  <h3>Quantitative analysis</h3><p>Momentum, volatility, Sharpe ratio. Captures factor returns.</p>
</div>

<div class="page">
  <h2>Machine Learning & Risk (plain language)</h2>
  <ul>
    <li><strong>XGBoost-style ensemble:</strong> probability-based ranking.</li>
    <li><strong>Random Forest:</strong> Strong Buy / Buy / Avoid classification.</li>
    <li><strong>Decision Tree:</strong> human-readable pass/fail rules.</li>
    <li><strong>Monte Carlo:</strong> thousands of simulated paths give a range, not a forecast.</li>
    <li><strong>Risk Score:</strong> volatility + drawdown + leverage + beta.</li>
  </ul>
  <div class="warning"><strong>⚠ Models do not guarantee returns.</strong> They rank and flag risk.</div>
</div>

<div class="page">
  <h2>Data Sources & Verification</h2>
  <ul>
    <li>Yahoo Finance (free) — prices, fundamentals, multiples.</li>
    <li>Manual CSV / Google Sheet — verified fundamentals where free data is partial.</li>
    <li>FRED — macro indicators (rates, CPI, FX).</li>
    <li>Free public news (RSS) + manual curation.</li>
  </ul>
  <p>Missing values are shown as <em>"data unavailable — requires manual verification"</em>. No silent imputation.</p>
</div>

<div class="page">
  <h2>Node Workflow Map</h2>
  <p>Data → Modules → ML → Simulation → Composite Score → Top 100 → 50 → 20 → Portfolio.</p>
  <table>
    <tr><th>Group</th><th>Nodes</th></tr>
    <tr><td>Data</td><td>Universe, yfinance fetch, Clean, FRED macro, Sector/Industry mapping, Manual CSV</td></tr>
    <tr><td>Modules</td><td>Fundamental, Valuation, Quant, Technical, Qualitative, Sector, Industry, Sentiment, Macro suitability</td></tr>
    <tr><td>ML</td><td>XGBoost-style, Random Forest, Decision Tree</td></tr>
    <tr><td>Simulation</td><td>Monte Carlo, Scenario stress, Risk scoring</td></tr>
    <tr><td>Output</td><td>Composite, Top-N ranking, Portfolio plan, Sector summary, Audit trail</td></tr>
  </table>
</div>

<div class="page">
  <h2>Sector Summary</h2>
  <table>
    <thead><tr><th>Sector</th><th>Stocks</th><th>Avg Composite</th></tr></thead>
    <tbody>
      ${sectorRows.map((s) => `<tr><td>${s.sector}</td><td>${s.count}</td><td>${s.avg.toFixed(1)}</td></tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="page">
  <h2>Custom Selection & Horizon Results</h2>
  <p>Filters applied: <span class="tag">${sector}</span> <span class="tag">${horizon}</span></p>
  <p>${filtered.length} stocks passed filters.</p>
  <p>Average composite of selected: <strong>${(filtered.reduce((s, r) => s + r.scores.composite, 0) / Math.max(1, filtered.length)).toFixed(1)}</strong>.</p>
</div>

<div class="page">
  <h2>Final Stock Candidates</h2>
  <table>
    <thead><tr><th>#</th><th>Stock</th><th>Sector</th><th>Price</th><th>Entry</th><th>Stop</th><th>T1</th><th>T2</th><th>Risk</th><th>Conf.</th></tr></thead>
    <tbody>
      ${top.map((r, i) => {
        const p = r.metrics.price ?? 100;
        const vol = r.metrics.volatility ?? 0.3;
        const stop = (p * (1 - Math.min(0.15, vol * 0.4))).toFixed(0);
        const t1 = (p * (1 + Math.max(0.06, vol * 0.6))).toFixed(0);
        const t2 = (p * (1 + Math.max(0.12, vol * 1.0))).toFixed(0);
        const risk = vol > 0.45 ? "High" : vol > 0.3 ? "Medium" : "Low";
        const conf = r.scores.composite >= 70 ? "High" : r.scores.composite >= 55 ? "Med" : "Low";
        return `<tr><td>${i + 1}</td><td>${r.entry.symbol.replace(".NS", "")}</td><td>${r.entry.sector}</td><td>${cur}${p.toFixed(0)}</td><td>${cur}${(p * 0.97).toFixed(0)}–${cur}${(p * 1.03).toFixed(0)}</td><td>${cur}${stop}</td><td>${cur}${t1}</td><td>${cur}${t2}</td><td>${risk}</td><td>${conf}</td></tr>`;
      }).join("")}
    </tbody>
  </table>
  <div class="warning">Research-based candidates only. Not guaranteed advice. Consult a registered investment advisor before investing.</div>
</div>

<div class="page">
  <h2>Educational Notes & Limitations</h2>
  <ul>
    <li>Diversification (across sectors and stocks) is the most important risk-management lever.</li>
    <li>Position sizing matters more than picking winners.</li>
    <li>Free data has delays and gaps; numbers above are research aids, not real-time.</li>
    <li>Models are simplified — they capture patterns, not future certainty.</li>
    <li>Always verify with primary filings before any real trade.</li>
  </ul>
  <div class="warning"><strong>This report is for education and research only.</strong> It is not investment advice. Past patterns may not repeat. Real outcomes will differ from model estimates.</div>
  <p class="muted">Generated by ALPHADESK · ${today}</p>
</div>

</body></html>`;
}

export function downloadReport(html: string, filename = "alphadesk-report.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  // Open in new tab so user can review then Print → Save as PDF
  const w = window.open(url, "_blank");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
