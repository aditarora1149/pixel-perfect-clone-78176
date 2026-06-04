import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, Bar, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/scenario-lab")({
  head: () => ({ meta: [{ title: "Scenario Lab — ALPHADESK" }] }),
  component: ScenarioLab,
});

// Sector-impact matrix. Values: -3 (very negative) … +3 (very positive).
// Derived from textbook macro relationships. Transparent and editable.
const SCENARIOS: Record<string, { label: string; description: string; impacts: Record<string, number> }> = {
  rateUp50: {
    label: "Interest rate UP +0.50%",
    description: "Higher cost of borrowing, DCFs compressed, NIMs may improve for banks.",
    impacts: { Financials: 1, "Real Estate": -3, "Consumer Discretionary": -2, Technology: -2, Utilities: -2, Industrials: -1, Energy: 0, Materials: -1, "Health Care": 0, "Consumer Staples": 0, "Communication Services": -1 },
  },
  rateDown50: {
    label: "Interest rate DOWN -0.50%",
    description: "Cheaper credit, growth & real-estate boost, NIMs squeezed.",
    impacts: { Financials: -1, "Real Estate": 3, "Consumer Discretionary": 2, Technology: 2, Utilities: 2, Industrials: 1, Energy: 0, Materials: 1, "Health Care": 1, "Consumer Staples": 1, "Communication Services": 1 },
  },
  inflationUp: {
    label: "Inflation shock UP",
    description: "Margin compression for low-margin / high-input cost businesses.",
    impacts: { Financials: -1, "Real Estate": -2, "Consumer Discretionary": -3, Technology: -1, Utilities: -2, Industrials: -2, Energy: 3, Materials: 2, "Health Care": 0, "Consumer Staples": -1, "Communication Services": -1 },
  },
  inrDown: {
    label: "INR depreciation",
    description: "Exporters benefit, importers and foreign-debt firms hurt.",
    impacts: { Technology: 3, "Health Care": 2, Energy: -2, Materials: 1, Industrials: 0, Financials: 0, "Consumer Discretionary": -2, "Consumer Staples": -1, Utilities: -1, "Real Estate": -1, "Communication Services": -1 },
  },
  oilUp: {
    label: "Crude oil +15%",
    description: "Energy producers win, transportation, paints, FMCG suffer.",
    impacts: { Energy: 3, Materials: 1, Industrials: -2, "Consumer Discretionary": -2, "Consumer Staples": -2, Utilities: -1, Technology: -1, "Health Care": 0, Financials: -1, "Real Estate": 0, "Communication Services": 0 },
  },
  recession: {
    label: "Recession / GDP slowdown",
    description: "Cyclicals collapse, defensives hold up.",
    impacts: { Financials: -3, "Consumer Discretionary": -3, Materials: -3, Industrials: -2, Energy: -2, Technology: -1, "Real Estate": -2, "Communication Services": -1, "Health Care": 2, "Consumer Staples": 2, Utilities: 1 },
  },
  cryptoCrash: {
    label: "Bitcoin / risk-asset crash",
    description: "Risk-off across high-beta growth and fintech-adjacent names.",
    impacts: { Technology: -2, Financials: -1, "Communication Services": -1, "Consumer Discretionary": -1, Energy: 0, "Health Care": 0, "Consumer Staples": 1, Utilities: 1, Materials: -1, Industrials: -1, "Real Estate": -1 },
  },
  defenseUp: {
    label: "Defense spending +20% (political)",
    description: "Aerospace, industrials, metals benefit. Negligible on consumer.",
    impacts: { Industrials: 3, Materials: 2, Technology: 1, Energy: 1, Financials: 0, "Consumer Discretionary": 0, "Consumer Staples": 0, "Health Care": 0, Utilities: 0, "Real Estate": 0, "Communication Services": 0 },
  },
};

function ScenarioLab() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const [scenarioKey, setScenarioKey] = useState<keyof typeof SCENARIOS>("rateDown50");
  const scen = SCENARIOS[scenarioKey];

  const adjusted = useMemo(() => {
    return rows
      .map((r) => {
        const delta = (scen.impacts[r.entry.sector] ?? 0) * 3.5; // ±3 → ±10.5 pts
        const newScore = Math.max(0, Math.min(100, r.scores.composite + delta));
        return { ...r, delta, newScore };
      })
      .sort((a, b) => b.newScore - a.newScore);
  }, [rows, scen]);

  return (
    <Page title="Scenario Lab" subtitle="Stress-test the entire universe against macro / political / social / crypto shocks. Transparent sector-impact matrix." badge="★ FLAGSHIP">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Panel title="Pick scenario" className="lg:col-span-1">
          <div className="space-y-1">
            {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((k) => (
              <button
                key={k}
                onClick={() => setScenarioKey(k)}
                className={`w-full text-left p-2 rounded text-xs border ${
                  scenarioKey === k ? "bg-primary/15 border-primary/50 text-foreground" : "border-border/40 hover:bg-secondary/40"
                }`}
              >
                {SCENARIOS[k].label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={scen.label} className="lg:col-span-3">
          <p className="text-sm text-muted-foreground mb-3">{scen.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {Object.entries(scen.impacts).map(([sec, v]) => (
              <div key={sec} className="flex items-center justify-between px-2 py-1 rounded bg-secondary/40 text-xs">
                <span>{sec}</span>
                <span className={`tabular-nums font-mono ${v > 0 ? "text-[var(--bull)]" : v < 0 ? "text-[var(--bear)]" : "text-muted-foreground"}`}>
                  {v > 0 ? "+" : ""}{v}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs uppercase text-muted-foreground mb-2">Winners (Top 10 after shock)</div>
          {adjusted.slice(0, 10).map((r) => (
            <div key={r.entry.symbol} className="flex items-center gap-2 mb-1.5">
              <div className="w-24 text-sm font-semibold">{r.entry.symbol.replace(".NS", "")}</div>
              <div className="text-[10px] text-muted-foreground w-32 truncate">{r.entry.sector}</div>
              <Bar value={r.newScore} />
              <span className="text-xs font-mono w-10 text-right">{r.newScore.toFixed(0)}</span>
              <span className={`text-xs tabular-nums w-12 text-right ${r.delta > 0 ? "text-[var(--bull)]" : r.delta < 0 ? "text-[var(--bear)]" : "text-muted-foreground"}`}>
                {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}
              </span>
            </div>
          ))}

          <div className="text-xs uppercase text-muted-foreground mt-4 mb-2">Losers (Bottom 10 after shock)</div>
          {adjusted.slice(-10).reverse().map((r) => (
            <div key={r.entry.symbol} className="flex items-center gap-2 mb-1.5">
              <div className="w-24 text-sm font-semibold">{r.entry.symbol.replace(".NS", "")}</div>
              <div className="text-[10px] text-muted-foreground w-32 truncate">{r.entry.sector}</div>
              <Bar value={r.newScore} />
              <span className="text-xs font-mono w-10 text-right">{r.newScore.toFixed(0)}</span>
              <span className={`text-xs tabular-nums w-12 text-right ${r.delta > 0 ? "text-[var(--bull)]" : "text-[var(--bear)]"}`}>
                {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}
              </span>
            </div>
          ))}

          <DataSource source="Sector-impact matrix is editable & version-controlled (src/routes/scenario-lab.tsx). Not a forecast — a structural sensitivity tool." />
        </Panel>
      </div>
    </Page>
  );
}
