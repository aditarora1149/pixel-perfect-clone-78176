import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, Bar, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/screener")({
  head: () => ({ meta: [{ title: "Screener · Top 100 — ALPHADESK" }] }),
  component: ScreenerPage,
});

function ScreenerPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const [q, setQ] = useState("");
  const filtered = rows.filter(
    (r) => !q || r.entry.symbol.toLowerCase().includes(q.toLowerCase()) || r.entry.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Page title="Screener — Top 100" subtitle="Stage 1 funnel. Universe → ranked by composite score from 6 transparent modules." badge="STAGE 1">
      <Panel>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by symbol or name…"
          className="w-full md:w-80 px-3 py-2 bg-secondary border border-border rounded text-sm mb-3"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left">Stock</th>
                <th className="text-left">Sector</th>
                <th className="text-right">Fund</th>
                <th className="text-right">Val</th>
                <th className="text-right">Quant</th>
                <th className="text-right">Tech</th>
                <th className="text-right">ML</th>
                <th className="text-right">Composite</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.entry.symbol} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td>
                    <Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="hover:text-primary font-semibold">
                      {r.entry.symbol.replace(".NS", "")}
                    </Link>
                    <div className="text-[10px] text-muted-foreground">{r.entry.name}</div>
                  </td>
                  <td className="text-xs text-muted-foreground">{r.entry.sector}</td>
                  <td className="text-right tabular-nums">{r.scores.fundamental.toFixed(0)}</td>
                  <td className="text-right tabular-nums">{r.scores.valuation.toFixed(0)}</td>
                  <td className="text-right tabular-nums">{r.scores.quantitative.toFixed(0)}</td>
                  <td className="text-right tabular-nums">{r.scores.technical.toFixed(0)}</td>
                  <td className="text-right tabular-nums">{r.scores.ml.toFixed(0)}</td>
                  <td className="text-right"><ScorePill score={r.scores.composite} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataSource source="Seed data (sector-aware) · live API hook ready" />
      </Panel>
    </Page>
  );
}
