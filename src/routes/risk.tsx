import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, DataSource, Bar } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/risk")({
  head: () => ({ meta: [{ title: "Risk Dashboard — ALPHADESK" }] }),
  component: RiskPage,
});

function RiskPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const all = useMemo(() => rankUniverse(market, weights), [market, weights]);

  const ranked = all
    .map((r) => {
      const vol = (r.metrics.volatility ?? 0.3) * 100;
      const dd = Math.abs((r.metrics.maxDrawdown ?? 0) * 100);
      const lev = Math.min(100, (r.metrics.debtToEquity ?? 0) * 25);
      const beta = Math.min(100, (r.metrics.beta ?? 1) * 50);
      const riskScore = Math.min(100, vol * 0.4 + dd * 0.3 + lev * 0.2 + beta * 0.1);
      return { ...r, vol, dd, lev, beta, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const top10Risky = ranked.slice(0, 10);
  const top10Safe = [...ranked].reverse().slice(0, 10);

  return (
    <Page title="Risk Dashboard" subtitle="Composite risk = volatility + drawdown + leverage + beta. Lower = safer.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Highest-Risk Stocks">
          {top10Risky.map((r) => (
            <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="flex items-center gap-2 py-1.5 border-b border-border/30 hover:bg-secondary/30">
              <span className="text-sm font-semibold w-28 truncate">{r.entry.symbol.replace(".NS", "")}</span>
              <div className="flex-1"><Bar value={r.riskScore} /></div>
              <span className="text-xs font-mono w-10 text-right text-[var(--bear)]">{r.riskScore.toFixed(0)}</span>
            </Link>
          ))}
        </Panel>
        <Panel title="Safest Stocks">
          {top10Safe.map((r) => (
            <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="flex items-center gap-2 py-1.5 border-b border-border/30 hover:bg-secondary/30">
              <span className="text-sm font-semibold w-28 truncate">{r.entry.symbol.replace(".NS", "")}</span>
              <div className="flex-1"><Bar value={100 - r.riskScore} /></div>
              <span className="text-xs font-mono w-10 text-right text-[var(--bull)]">{r.riskScore.toFixed(0)}</span>
            </Link>
          ))}
        </Panel>
      </div>
      <div className="mt-3"><DataSource source="Risk composite: 40% vol + 30% drawdown + 20% leverage + 10% beta" /></div>
    </Page>
  );
}
