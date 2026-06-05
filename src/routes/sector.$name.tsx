import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/sector/$name")({
  head: ({ params }) => ({ meta: [{ title: `${decodeURIComponent(params.name)} sector — ALPHADESK` }] }),
  component: SectorPage,
});

function SectorPage() {
  const { name } = Route.useParams();
  const sector = decodeURIComponent(name);
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const all = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const rows = all.filter((r) => r.entry.sector === sector);

  const avg = (k: "fundamental" | "valuation" | "quantitative" | "technical" | "composite") =>
    rows.length ? rows.reduce((s, r) => s + r.scores[k], 0) / rows.length : 0;

  const best5 = rows.slice(0, 5);
  const worst5 = [...rows].reverse().slice(0, 5);

  return (
    <Page title={`${sector} sector`} subtitle={`${rows.length} stocks · ranked by horizon-weighted composite.`}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {(["fundamental", "valuation", "quantitative", "technical", "composite"] as const).map((k) => (
          <Panel key={k}>
            <div className="text-[10px] uppercase text-muted-foreground">Avg {k}</div>
            <div className="text-2xl font-bold tabular-nums">{avg(k).toFixed(0)}</div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top 5 in sector">
          {best5.map((r, i) => (
            <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="flex items-center gap-3 py-2 border-b border-border/30 hover:bg-secondary/30">
              <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</div>
                <div className="text-[10px] text-muted-foreground">{r.entry.industry}</div>
              </div>
              <ScorePill score={r.scores.composite} />
            </Link>
          ))}
        </Panel>
        <Panel title="Bottom 5 (highest concerns)">
          {worst5.map((r, i) => (
            <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="flex items-center gap-3 py-2 border-b border-border/30 hover:bg-secondary/30">
              <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</div>
                <div className="text-[10px] text-muted-foreground">{r.entry.industry}</div>
              </div>
              <ScorePill score={r.scores.composite} />
            </Link>
          ))}
        </Panel>
      </div>
      <div className="mt-3"><DataSource source={`Sector slice of horizon-weighted composite (${market})`} /></div>
    </Page>
  );
}
