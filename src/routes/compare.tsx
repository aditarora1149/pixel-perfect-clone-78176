import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, ScorePill, Bar, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { getUniverse, findEntry } from "@/lib/universe";
import { computeAllScores, seedMetrics } from "@/lib/scoring";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare Stocks — ALPHADESK" }] }),
  component: ComparePage,
});

function ComparePage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const universe = getUniverse(market);
  const [picks, setPicks] = useState<string[]>([universe[0]?.symbol, universe[1]?.symbol, universe[2]?.symbol].filter(Boolean) as string[]);

  const rows = useMemo(() =>
    picks.map((sym) => {
      const e = findEntry(sym);
      if (!e) return null;
      const m = seedMetrics(e.symbol, e.sector);
      return { entry: e, scores: computeAllScores(m, e, weights) };
    }).filter((r): r is NonNullable<typeof r> => !!r),
  [picks, weights]);

  return (
    <Page title="Compare Stocks" subtitle="Side-by-side score comparison across all 6 modules.">
      <Panel>
        <div className="flex gap-2 flex-wrap mb-4">
          {picks.map((p, i) => (
            <select key={i} value={p} onChange={(e) => setPicks(picks.map((x, j) => j === i ? e.target.value : x))} className="bg-secondary border border-border rounded px-2 py-1.5 text-sm">
              {universe.map((u) => <option key={u.symbol} value={u.symbol}>{u.symbol.replace(".NS", "")}</option>)}
            </select>
          ))}
          {picks.length < 5 && (
            <button onClick={() => setPicks([...picks, universe[0].symbol])} className="px-3 py-1.5 bg-primary/20 text-primary rounded text-sm font-semibold">+ Add</button>
          )}
          {picks.length > 2 && (
            <button onClick={() => setPicks(picks.slice(0, -1))} className="px-3 py-1.5 bg-secondary rounded text-sm">Remove</button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2">Metric</th>
                {rows.map((r) => <th key={r.entry.symbol} className="text-right">{r.entry.symbol.replace(".NS", "")}</th>)}
              </tr>
            </thead>
            <tbody>
              {(["fundamental", "valuation", "quantitative", "technical", "qualitative", "ml"] as const).map((k) => (
                <tr key={k} className="border-b border-border/30">
                  <td className="py-2 text-muted-foreground capitalize">{k}</td>
                  {rows.map((r) => (
                    <td key={r.entry.symbol} className="text-right py-2">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20"><Bar value={r.scores[k]} /></div>
                        <span className="font-mono tabular-nums w-8">{r.scores[k].toFixed(0)}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-secondary/20">
                <td className="py-2 font-semibold">Composite</td>
                {rows.map((r) => <td key={r.entry.symbol} className="text-right py-2"><ScorePill score={r.scores.composite} /></td>)}
              </tr>
              <tr><td className="py-2 text-muted-foreground">Classification</td>
                {rows.map((r) => <td key={r.entry.symbol} className="text-right py-2 text-xs font-semibold">{r.scores.classification}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <DataSource source="Transparent scoring engine — same weights across all stocks" />
      </Panel>
    </Page>
  );
}
