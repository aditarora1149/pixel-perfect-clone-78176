import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, Bar, DataSource } from "@/components/common";
import { useAppStore, DEFAULT_WEIGHTS } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/sandbox")({
  head: () => ({ meta: [{ title: "Weight Sandbox — ALPHADESK" }] }),
  component: SandboxPage,
});

const LABELS: Record<keyof typeof DEFAULT_WEIGHTS, string> = {
  fundamental: "Fundamental",
  valuation: "Valuation",
  quantitative: "Quant Factors",
  technical: "Technical",
  qualitative: "Qualitative",
  ml: "ML Ensemble",
};

function SandboxPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const setWeights = useAppStore((s) => s.setWeights);
  const reset = useAppStore((s) => s.resetWeights);
  const rows = useMemo(() => rankUniverse(market, weights).slice(0, 20), [market, weights]);

  return (
    <Page title="Weight Sandbox" subtitle="Tune the 6 module weights. Top 20 re-ranks live. Institutional defaults available." badge="INTERACTIVE">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Module weights" right={<button onClick={reset} className="text-xs text-primary hover:underline">Reset</button>}>
          {(Object.keys(LABELS) as Array<keyof typeof DEFAULT_WEIGHTS>).map((k) => (
            <div key={k} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{LABELS[k]}</span>
                <span className="font-mono">{weights[k]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights[k]}
                onChange={(e) => setWeights({ [k]: +e.target.value })}
                className="w-full"
              />
            </div>
          ))}
          <DataSource source={`Defaults: F:${DEFAULT_WEIGHTS.fundamental} V:${DEFAULT_WEIGHTS.valuation} Q:${DEFAULT_WEIGHTS.quantitative} T:${DEFAULT_WEIGHTS.technical} Ql:${DEFAULT_WEIGHTS.qualitative} ML:${DEFAULT_WEIGHTS.ml}`} />
        </Panel>

        <Panel title="Live Top 20">
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2">
            {rows.map((r, i) => (
              <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }}>
                <div className="flex items-center justify-between gap-2 p-2 rounded border border-border/40 hover:border-primary/40 hover:bg-secondary/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.entry.symbol.replace(".NS", "")}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{r.entry.sector}</div>
                    </div>
                  </div>
                  <ScorePill score={r.scores.composite} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
