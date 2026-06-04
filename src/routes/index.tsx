import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, Bar, DataSource, fmtPct, fmtNum } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse, sectorBuckets } from "@/lib/screener";
import { useMemo } from "react";
import { TrendingUp, AlertTriangle, Layers, Activity, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALPHADESK — Institutional Stock Engine" },
      { name: "description", content: "Transparent institutional-grade stock analysis: scoring, ML, Monte Carlo, scenarios, and AI analyst — all explainable, all sourced." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const top20 = rows.slice(0, 20);
  const sectors = sectorBuckets(rows).slice(0, 8);
  const avgComposite = rows.reduce((s, r) => s + r.scores.composite, 0) / rows.length;
  const bullishCount = rows.filter((r) => r.scores.composite >= 65).length;

  return (
    <Page
      title="Executive Dashboard"
      subtitle={`${market === "IN" ? "Indian NSE/BSE" : "US NYSE/NASDAQ"} universe · ${rows.length} stocks scored through 6 transparent modules + ML ensemble`}
      badge="LIVE ENGINE"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Panel>
          <div className="text-xs text-muted-foreground mb-1">Universe Size</div>
          <div className="text-2xl font-bold tabular-nums">{rows.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">curated seed list</div>
        </Panel>
        <Panel>
          <div className="text-xs text-muted-foreground mb-1">Avg Composite Score</div>
          <div className="text-2xl font-bold tabular-nums text-primary">{avgComposite.toFixed(1)}</div>
          <Bar value={avgComposite} />
        </Panel>
        <Panel>
          <div className="text-xs text-muted-foreground mb-1">Bullish Candidates (≥65)</div>
          <div className="text-2xl font-bold tabular-nums text-[var(--bull)]">{bullishCount}</div>
          <div className="text-[10px] text-muted-foreground mt-1">passed institutional filters</div>
        </Panel>
        <Panel>
          <div className="text-xs text-muted-foreground mb-1">Market Regime</div>
          <div className="text-2xl font-bold tabular-nums">
            {bullishCount > rows.length * 0.4 ? (
              <span className="text-[var(--bull)]">Risk-On</span>
            ) : bullishCount > rows.length * 0.2 ? (
              <span className="text-[var(--warning)]">Neutral</span>
            ) : (
              <span className="text-[var(--bear)]">Risk-Off</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">based on ensemble breadth</div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Top 20 Preview" className="lg:col-span-2" right={<Link to="/top-20" className="text-xs text-primary hover:underline flex items-center gap-1">View full ranking <ArrowRight className="h-3 w-3" /></Link>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left">Stock</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">Upside</th>
                  <th className="text-right">Class</th>
                </tr>
              </thead>
              <tbody>
                {top20.slice(0, 10).map((r, i) => (
                  <tr key={r.entry.symbol} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td>
                      <Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="hover:text-primary">
                        <div className="font-semibold">{r.entry.symbol.replace(".NS", "")}</div>
                        <div className="text-[10px] text-muted-foreground">{r.entry.sector}</div>
                      </Link>
                    </td>
                    <td className="text-right"><ScorePill score={r.scores.composite} /></td>
                    <td className="text-right text-[var(--bull)] tabular-nums">+{r.upsidePct.toFixed(1)}%</td>
                    <td className="text-right text-xs">{r.scores.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataSource source="Yahoo Finance seed · transparent scoring engine" updated="just now" />
        </Panel>

        <Panel title="Sector Heatmap">
          <div className="space-y-2">
            {sectors.map((s) => (
              <div key={s.sector}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.sector}</span>
                  <span className="tabular-nums font-mono">{s.avgScore.toFixed(0)}</span>
                </div>
                <Bar value={s.avgScore} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Link to="/analyst">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <Activity className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">AI Analyst Chat</div>
            <div className="text-xs text-muted-foreground mt-1">Ask grounded questions about any stock, score, or scenario.</div>
          </Panel>
        </Link>
        <Link to="/simulation/monte-carlo">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">Monte Carlo Simulator</div>
            <div className="text-xs text-muted-foreground mt-1">Interactive GBM paths, VaR, CVaR, probability of profit.</div>
          </Panel>
        </Link>
        <Link to="/scenario-lab">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <AlertTriangle className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">Scenario Lab</div>
            <div className="text-xs text-muted-foreground mt-1">Stress-test rates, inflation, FX, oil, politics, crypto — see who wins.</div>
          </Panel>
        </Link>
        <Link to="/workflow">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <Layers className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">Workflow Node Map</div>
            <div className="text-xs text-muted-foreground mt-1">Every step visible: universe → data → models → ranking → portfolio.</div>
          </Panel>
        </Link>
        <Link to="/sandbox">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <Activity className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">Weight Sandbox</div>
            <div className="text-xs text-muted-foreground mt-1">Tune the 6 module weights, see Top 20 re-rank live.</div>
          </Panel>
        </Link>
        <Link to="/strategy/10k">
          <Panel className="hover:border-primary/50 cursor-pointer transition-colors h-full">
            <Layers className="h-5 w-5 text-primary mb-2" />
            <div className="font-semibold">₹10k / ₹50k Weekly Plans</div>
            <div className="text-xs text-muted-foreground mt-1">Position-sized deployment plans with sector caps and risk budget.</div>
          </Panel>
        </Link>
      </div>
    </Page>
  );
}
