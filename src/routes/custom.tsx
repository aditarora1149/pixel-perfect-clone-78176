import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore, weightsForHorizon, HORIZONS, type Horizon } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/custom")({
  head: () => ({ meta: [{ title: "Custom Analysis — ALPHADESK" }] }),
  component: CustomPage,
});

function CustomPage() {
  const market = useAppStore((s) => s.market);
  const [horizon, setHorizon] = useState<Horizon>(useAppStore.getState().horizon);
  const [sector, setSector] = useState<string>("All");
  const [minMcap, setMinMcap] = useState(0);
  const [maxPe, setMaxPe] = useState(100);
  const [minComposite, setMinComposite] = useState(0);

  const weights = useMemo(() => weightsForHorizon(horizon), [horizon]);
  const all = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const sectors = useMemo(() => ["All", ...new Set(all.map((r) => r.entry.sector))], [all]);

  const filtered = all.filter((r) => {
    if (sector !== "All" && r.entry.sector !== sector) return false;
    if ((r.metrics.marketCap ?? 0) / 1e9 < minMcap) return false;
    if ((r.metrics.trailingPE ?? 999) > maxPe) return false;
    if (r.scores.composite < minComposite) return false;
    return true;
  });

  return (
    <Page title="Custom Analysis & Screener" subtitle="Pick a horizon and filters. Engine re-ranks live with horizon-aware weights.">
      <Panel title="Filters">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Horizon</label>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm">
              {HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
            <div className="text-[10px] text-muted-foreground mt-1">{HORIZONS.find((h) => h.id === horizon)?.desc}</div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Sector</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm">
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Min Mcap (B)</label>
            <input type="number" value={minMcap} onChange={(e) => setMinMcap(+e.target.value)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Max P/E</label>
            <input type="number" value={maxPe} onChange={(e) => setMaxPe(+e.target.value)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Min Composite</label>
            <input type="number" value={minComposite} onChange={(e) => setMinComposite(+e.target.value)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
      </Panel>

      <div className="mt-4">
        <Panel title={`Results: ${filtered.length} stocks · horizon: ${horizon}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filtered.slice(0, 40).map((r, i) => (
              <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }}>
                <div className="flex items-center justify-between p-2 rounded border border-border/40 hover:border-primary/40 hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
                    <div>
                      <div className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</div>
                      <div className="text-[10px] text-muted-foreground">{r.entry.sector} · P/E {(r.metrics.trailingPE ?? 0).toFixed(1)}</div>
                    </div>
                  </div>
                  <ScorePill score={r.scores.composite} />
                </div>
              </Link>
            ))}
          </div>
          <DataSource source={`Horizon-weighted scoring (${horizon})`} />
        </Panel>
      </div>
    </Page>
  );
}
