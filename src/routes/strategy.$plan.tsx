import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore, weightsForHorizon } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/strategy/$plan")({
  head: ({ params }) => ({ meta: [{ title: `Strategy ${params.plan} — ALPHADESK` }] }),
  component: StrategyPage,
});

const PLANS: Record<string, { weekly: number; label: string; currency: string; horizonLabel: string }> = {
  "10k": { weekly: 10000, label: "₹10,000 / week", currency: "₹", horizonLabel: "long-term compounding" },
  "50k": { weekly: 50000, label: "₹50,000 / week", currency: "₹", horizonLabel: "long-term compounding" },
};

function StrategyPage() {
  const { plan } = Route.useParams();
  const cfg = PLANS[plan];
  if (!cfg) throw notFound();

  const market = useAppStore((s) => s.market);
  const weights = useMemo(() => weightsForHorizon("long"), []);
  const top = useMemo(() => rankUniverse(market, weights).slice(0, 10), [market, weights]);

  const totalScore = top.reduce((s, r) => s + r.scores.composite, 0);
  const allocs = top.map((r) => {
    const pct = r.scores.composite / totalScore;
    const rupees = Math.round(cfg.weekly * pct);
    const shares = Math.floor(rupees / (r.metrics.price ?? 100));
    return { ...r, pct, rupees, shares };
  });

  return (
    <Page title={`Weekly Plan: ${cfg.label}`} subtitle={`Score-weighted Top-10 portfolio for ${cfg.horizonLabel}. Allocation example, not advice.`} badge="WEEKLY">
      <Panel>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
            <tr><th className="text-left py-2">#</th><th className="text-left">Stock</th><th className="text-left">Sector</th><th className="text-right">Score</th><th className="text-right">Price</th><th className="text-right">Weight</th><th className="text-right">Weekly {cfg.currency}</th><th className="text-right">Shares</th></tr>
          </thead>
          <tbody>
            {allocs.map((r, i) => (
              <tr key={r.entry.symbol} className="border-b border-border/30 hover:bg-secondary/30">
                <td className="py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                <td><Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="font-semibold hover:text-primary">{r.entry.symbol.replace(".NS", "")}</Link></td>
                <td className="text-xs text-muted-foreground">{r.entry.sector}</td>
                <td className="text-right"><ScorePill score={r.scores.composite} /></td>
                <td className="text-right font-mono tabular-nums">{cfg.currency}{(r.metrics.price ?? 0).toFixed(0)}</td>
                <td className="text-right font-mono tabular-nums">{(r.pct * 100).toFixed(1)}%</td>
                <td className="text-right font-mono tabular-nums text-primary">{cfg.currency}{r.rupees.toLocaleString("en-IN")}</td>
                <td className="text-right font-mono tabular-nums">{r.shares}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td colSpan={6} className="py-2 text-right">Total weekly deployment:</td>
              <td className="text-right font-mono text-primary">{cfg.currency}{allocs.reduce((s, a) => s + a.rupees, 0).toLocaleString("en-IN")}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        <DataSource source="Score-weighted long-horizon portfolio with fractional rounding" />
      </Panel>

      <div className="mt-4 text-xs text-muted-foreground p-3 border border-border rounded bg-secondary/20 leading-relaxed">
        <strong className="text-foreground">Important:</strong> Skip or reduce buying if market conditions are clearly unfavorable or major negative news appears. This plan rebalances every week based on the latest scoring run. Treat as an allocation example for research/education, not as guaranteed advice.
      </div>
    </Page>
  );
}
