import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { seedMetrics } from "@/lib/scoring";
import { findEntry, getUniverse } from "@/lib/universe";
import { runMonteCarlo } from "@/lib/monte-carlo";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/simulation/monte-carlo")({
  head: () => ({ meta: [{ title: "Monte Carlo Simulator — ALPHADESK" }] }),
  component: MCPage,
});

function MCPage() {
  const market = useAppStore((s) => s.market);
  const universe = getUniverse(market);
  const [symbol, setSymbol] = useState(universe[0].symbol);
  const entry = findEntry(symbol)!;
  const m = useMemo(() => seedMetrics(entry.symbol, entry.sector), [entry]);

  const [days, setDays] = useState(252);
  const [paths, setPaths] = useState(1000);
  const [muOverride, setMuOverride] = useState<number | null>(null);
  const [sigOverride, setSigOverride] = useState<number | null>(null);

  const mu = muOverride ?? (m.return1y ?? 0.12);
  const sigma = sigOverride ?? (m.volatility ?? 0.30);
  const price = m.price ?? 100;

  const sim = useMemo(
    () => runMonteCarlo({ startPrice: price, mu, sigma, days, paths, seed: 42 }),
    [price, mu, sigma, days, paths],
  );

  const cur = entry.market === "IN" ? "₹" : "$";

  // Build SVG fan chart
  const W = 700, H = 280;
  const allVals = sim.paths.flat();
  const lo = Math.min(...allVals), hi = Math.max(...allVals);
  const xs = (i: number, len: number) => (i / (len - 1)) * W;
  const ys = (v: number) => H - ((v - lo) / (hi - lo)) * H;

  return (
    <Page title="Monte Carlo Simulator" subtitle="Geometric Brownian Motion paths · client-side · transparent assumptions." badge="★ FLAGSHIP">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Inputs">
          <label className="block text-xs text-muted-foreground mb-1">Stock</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-sm mb-3">
            {universe.map((u) => <option key={u.symbol} value={u.symbol}>{u.symbol.replace(".NS", "")} — {u.name}</option>)}
          </select>

          <label className="block text-xs text-muted-foreground mb-1">Horizon: {days} trading days (~{(days / 21).toFixed(1)} months)</label>
          <input type="range" min={20} max={504} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full mb-3" />

          <label className="block text-xs text-muted-foreground mb-1">Paths: {paths}</label>
          <input type="range" min={100} max={5000} step={100} value={paths} onChange={(e) => setPaths(+e.target.value)} className="w-full mb-3" />

          <label className="block text-xs text-muted-foreground mb-1">Expected return μ: {(mu * 100).toFixed(1)}%</label>
          <input type="range" min={-30} max={50} value={mu * 100} onChange={(e) => setMuOverride(+e.target.value / 100)} className="w-full mb-3" />

          <label className="block text-xs text-muted-foreground mb-1">Volatility σ: {(sigma * 100).toFixed(1)}%</label>
          <input type="range" min={5} max={100} value={sigma * 100} onChange={(e) => setSigOverride(+e.target.value / 100)} className="w-full mb-3" />

          <DataSource source={`Seed: 42 · seeded historical μ=${((m.return1y ?? 0) * 100).toFixed(1)}%, σ=${((m.volatility ?? 0) * 100).toFixed(1)}%`} />
        </Panel>

        <Panel title="Outcomes" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><div className="text-[10px] text-muted-foreground">Median</div><div className="text-lg font-bold">{cur}{sim.median.toFixed(2)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">P5 / P95</div><div className="text-lg font-bold">{cur}{sim.p5.toFixed(0)} / {sim.p95.toFixed(0)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">VaR 95% (loss)</div><div className="text-lg font-bold text-[var(--bear)]">{cur}{sim.var95.toFixed(2)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">CVaR 95%</div><div className="text-lg font-bold text-[var(--bear)]">{cur}{sim.cvar95.toFixed(2)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Prob. profit</div><div className="text-lg font-bold text-[var(--bull)]">{(sim.probProfit * 100).toFixed(1)}%</div></div>
            <div><div className="text-[10px] text-muted-foreground">Mean final</div><div className="text-lg font-bold">{cur}{sim.mean.toFixed(2)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Start</div><div className="text-lg font-bold">{cur}{price.toFixed(2)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Paths sampled</div><div className="text-lg font-bold">{sim.paths.length}</div></div>
          </div>

          <div className="rounded border border-border bg-background/40 p-2 overflow-x-auto">
            <svg width={W} height={H} className="w-full">
              {sim.paths.map((p, i) => (
                <polyline
                  key={i}
                  fill="none"
                  stroke="var(--primary)"
                  strokeOpacity={0.15}
                  strokeWidth={0.6}
                  points={p.map((v, j) => `${xs(j, p.length)},${ys(v)}`).join(" ")}
                />
              ))}
              <line x1={0} y1={ys(price)} x2={W} y2={ys(price)} stroke="var(--warning)" strokeDasharray="4 4" />
            </svg>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
