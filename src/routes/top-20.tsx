import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource, fmtNum } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";
import { Star } from "lucide-react";

export const Route = createFileRoute("/top-20")({
  head: () => ({ meta: [{ title: "Final Top 20 — ALPHADESK" }] }),
  component: () => {
    const market = useAppStore((s) => s.market);
    const weights = useAppStore((s) => s.weights);
    const watchlist = useAppStore((s) => s.watchlist);
    const toggle = useAppStore((s) => s.toggleWatch);
    const rows = useMemo(() => rankUniverse(market, weights).slice(0, 20), [market, weights]);
    const cur = market === "IN" ? "₹" : "$";

    return (
      <Page title="Final Top 20" subtitle="Institutional-grade picks with entry, stop-loss, target, and horizon." badge="★ FLAGSHIP">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left">Stock</th>
                  <th className="text-right">Entry</th>
                  <th className="text-right">Stop</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Upside</th>
                  <th className="text-right">Horizon</th>
                  <th className="text-right">Verdict</th>
                  <th className="text-right">Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const inWatch = watchlist.includes(r.entry.symbol);
                  return (
                    <tr key={r.entry.symbol} className="border-b border-border/30 hover:bg-secondary/30">
                      <td className="py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                      <td>
                        <Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="font-semibold hover:text-primary">
                          {r.entry.symbol.replace(".NS", "")}
                        </Link>
                        <div className="text-[10px] text-muted-foreground">{r.entry.name}</div>
                      </td>
                      <td className="text-right tabular-nums">{cur}{fmtNum(r.entryPrice)}</td>
                      <td className="text-right tabular-nums text-[var(--bear)]">{cur}{fmtNum(r.stopLoss)}</td>
                      <td className="text-right tabular-nums text-[var(--bull)]">{cur}{fmtNum(r.target)}</td>
                      <td className="text-right tabular-nums text-[var(--bull)]">+{r.upsidePct.toFixed(1)}%</td>
                      <td className="text-right text-xs text-muted-foreground">{r.horizonWeeks}w</td>
                      <td className="text-right text-xs">{r.scores.classification}</td>
                      <td className="text-right"><ScorePill score={r.scores.composite} /></td>
                      <td>
                        <button
                          onClick={() => toggle(r.entry.symbol)}
                          className="p-1 rounded hover:bg-secondary"
                          aria-label="Toggle watchlist"
                        >
                          <Star className={`h-3.5 w-3.5 ${inWatch ? "fill-[var(--warning)] text-[var(--warning)]" : "text-muted-foreground"}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DataSource source="Composite ensemble · entry/stop/target derived from volatility and score" />
        </Panel>
      </Page>
    );
  },
});
