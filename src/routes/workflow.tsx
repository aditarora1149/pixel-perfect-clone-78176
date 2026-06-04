import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel } from "@/components/common";

export const Route = createFileRoute("/workflow")({
  head: () => ({ meta: [{ title: "Workflow Node Map — ALPHADESK" }] }),
  component: WorkflowPage,
});

type Node = { id: string; label: string; col: number; row: number; group: string; detail: string };

const NODES: Node[] = [
  { id: "univ", label: "Stock Universe", col: 0, row: 1, group: "Data", detail: "Nifty 500 / S&P 500 curated seed JSON. ~50 sample stocks live; full list pluggable." },
  { id: "fetch", label: "Data Fetch (yfinance)", col: 1, row: 0, group: "Data", detail: "createServerFn → yahoo-finance2 → quote / history / fundamentals. Lazy per-symbol." },
  { id: "clean", label: "Clean & Validate", col: 1, row: 1, group: "Data", detail: "Null handling → 'data unavailable' state. No silent imputation." },
  { id: "macro", label: "Macro / FRED", col: 1, row: 2, group: "Data", detail: "10Y yield, CPI, USD/INR (cached daily). Affects scenario lab." },

  { id: "fund", label: "Fundamental Score", col: 2, row: 0, group: "Modules", detail: "Revenue growth, EPS growth, ROE, margins, D/E, current ratio. Piecewise-linear band scoring." },
  { id: "val", label: "Valuation Score", col: 2, row: 1, group: "Modules", detail: "Trailing P/E, fwd P/E, P/B, EV/EBITDA, yield. Weighted, returns 'Highly overvalued' → 'Deeply undervalued' verdict." },
  { id: "quant", label: "Quant Factors", col: 2, row: 2, group: "Modules", detail: "6m/1y momentum, quality (ROE), low-vol, Sharpe." },
  { id: "tech", label: "Technical Score", col: 2, row: 3, group: "Modules", detail: "Trend (SMA50/200), RSI(14), 1m return, drawdown, distance from 52w high." },
  { id: "qual", label: "Qualitative", col: 2, row: 4, group: "Modules", detail: "Sector tailwind table + market cap stability + leverage penalty. Transparent constants." },

  { id: "xgb", label: "XGBoost-style Logistic Ensemble", col: 3, row: 1, group: "ML", detail: "Fitted coefficients on growth/ROE/margin/momentum/valuation/debt/lowVol/sharpe. Logistic squash → 0-100." },
  { id: "rf", label: "Random Forest (3-class softmax)", col: 3, row: 2, group: "ML", detail: "Same feature vector, three-class softmax: Strong Buy / Buy / Avoid." },
  { id: "dt", label: "Decision Tree Explainer", col: 3, row: 3, group: "ML", detail: "Human-readable pass/fail path printed per stock." },

  { id: "mc", label: "Monte Carlo (GBM)", col: 4, row: 0, group: "Simulation", detail: "Client-side GBM, configurable μ/σ/paths/horizon. Returns VaR95, CVaR95, P5/P95, prob. profit." },
  { id: "scen", label: "Scenario / Stress", col: 4, row: 1, group: "Simulation", detail: "Rate ±, inflation, FX, oil, political, social, crypto. Sector-impact matrix." },
  { id: "risk", label: "Risk Scoring", col: 4, row: 2, group: "Simulation", detail: "Volatility / beta / drawdown / leverage composite." },

  { id: "comp", label: "Composite Score", col: 5, row: 1, group: "Output", detail: "Weighted sum of 6 modules using user-tunable weights (Sandbox)." },
  { id: "rank", label: "Top 100 → 50 → 20", col: 5, row: 2, group: "Output", detail: "Pure sort + filter — no hidden adjustments." },
  { id: "port", label: "Portfolio & Weekly Plan", col: 6, row: 1, group: "Output", detail: "₹10k / ₹50k position-sized with sector caps." },
  { id: "audit", label: "Audit Trail", col: 6, row: 2, group: "Output", detail: "Every score change, every model agreement/disagreement persisted." },
];

const EDGES: [string, string][] = [
  ["univ", "fetch"], ["univ", "clean"], ["fetch", "clean"], ["clean", "fund"], ["clean", "val"],
  ["clean", "quant"], ["clean", "tech"], ["clean", "qual"], ["macro", "scen"],
  ["fund", "xgb"], ["val", "xgb"], ["quant", "xgb"], ["tech", "xgb"],
  ["fund", "rf"], ["quant", "rf"], ["fund", "dt"], ["tech", "dt"],
  ["clean", "mc"], ["clean", "risk"], ["xgb", "comp"], ["rf", "comp"], ["dt", "comp"],
  ["fund", "comp"], ["val", "comp"], ["quant", "comp"], ["tech", "comp"], ["qual", "comp"],
  ["scen", "comp"], ["risk", "comp"], ["comp", "rank"], ["rank", "port"], ["comp", "audit"],
];

const GROUP_COLORS: Record<string, string> = {
  Data: "var(--info)",
  Modules: "var(--primary)",
  ML: "var(--accent)",
  Simulation: "var(--warning)",
  Output: "var(--bull)",
};

function WorkflowPage() {
  const COL_W = 200, ROW_H = 90;
  const W = 7 * COL_W, H = 5 * ROW_H + 40;
  const pos = (n: Node) => ({ x: n.col * COL_W + 20, y: n.row * ROW_H + 20 });
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n] as const));

  return (
    <Page title="Workflow Transparency & Node Map" subtitle="Every step from raw universe to final portfolio. Hover a node to read its purpose." badge="EXPLAINABLE">
      <Panel>
        <div className="overflow-x-auto">
          <svg width={W} height={H} className="min-w-[1200px]">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--muted-foreground)" opacity="0.5" />
              </marker>
            </defs>
            {EDGES.map(([a, b], i) => {
              const A = pos(byId[a]), B = pos(byId[b]);
              const x1 = A.x + 160, y1 = A.y + 25;
              const x2 = B.x, y2 = B.y + 25;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeOpacity="0.25"
                  strokeWidth="1"
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {NODES.map((n) => {
              const p = pos(n);
              const color = GROUP_COLORS[n.group];
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                  <rect width="160" height="50" rx="8" fill="var(--surface)" stroke={color} strokeWidth="1.5" />
                  <text x="10" y="20" fontSize="11" fontWeight="600" fill="var(--foreground)">{n.label}</text>
                  <text x="10" y="38" fontSize="9" fill={color} opacity="0.8">{n.group}</text>
                  <title>{n.detail}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {NODES.map((n) => (
          <Panel key={n.id}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[n.group] }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.group}</span>
            </div>
            <div className="font-semibold text-sm">{n.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{n.detail}</div>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
