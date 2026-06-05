import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore, weightsForHorizon } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio Allocation — ALPHADESK" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const market = useAppStore((s) => s.market);
  const horizon = useAppStore((s) => s.horizon);
  const weights = useMemo(() => weightsForHorizon(horizon), [horizon]);
  const top = useMemo(() => rankUniverse(market, weights).slice(0, 20), [market, weights]);

  // Sector cap: max 30% in any one sector; weight by composite score
  const totalScore = top.reduce((s, r) => s + r.scores.composite, 0);
  const sectorTotals = new Map<string, number>();
  const allocations = top.map((r) => {
    const raw = (r.scores.composite / totalScore) * 100;
    const prior = sectorTotals.get(r.entry.sector) ?? 0;
    const capped = Math.max(0, Math.min(raw, 30 - prior));
    sectorTotals.set(r.entry.sector, prior + capped);
    return { ...r, alloc: capped };
  });
  const totalAlloc = allocations.reduce((s, a) => s + a.alloc, 0);
  // Normalize to 100%
  const normalized = allocations.map((a) => ({ ...a, alloc: (a.alloc / totalAlloc) * 100 }));

  return (
    <Page
      title="Portfolio Allocation"
      subtitle="Score-weighted Top-20 with 30% sector cap. Designed to be diversified, not concentrated."
      badge={horizon.toUpperCase()}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Sector Mix" className="lg:col-span-1">
          {[...sectorTotals.entries()].sort((a, b) => b[1] - a[1]).map(([sec, pct]) => (
            <div key={sec} className="flex items-center justify-between text-xs my-1.5">
              <span className="text-muted-foreground truncate pr-2">{sec}</span>
              <span className="font-mono tabular-nums">{pct.toFixed(1)}%</span>
            </div>
          ))}
        </Panel>

        <Panel title="Allocation Table" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left py-1">#</th><th className="text-left">Stock</th><th className="text-left">Sector</th><th className="text-right">Score</th><th className="text-right">Allocation</th></tr>
            </thead>
            <tbody>
              {normalized.map((r, i) => (
                <tr key={r.entry.symbol} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td><Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="font-semibold hover:text-primary">{r.entry.symbol.replace(".NS", "")}</Link></td>
                  <td className="text-xs text-muted-foreground">{r.entry.sector}</td>
                  <td className="text-right"><ScorePill score={r.scores.composite} /></td>
                  <td className="text-right font-mono tabular-nums text-primary">{r.alloc.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <DataSource source={`Composite × sector-cap (30%) · horizon: ${horizon}`} />
        </Panel>
      </div>

      <div className="mt-4 text-xs text-muted-foreground p-3 border border-border rounded bg-secondary/20">
        <strong className="text-foreground">How this works:</strong> Each Top-20 stock is given weight proportional to its composite score. No sector may exceed 30%. Weights re-normalize to 100%. Treat as an allocation <em>example</em>, not a recommendation.
      </div>
    </Page>
  );
}
