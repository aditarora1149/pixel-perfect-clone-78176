import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Page, Panel, ScorePill, Bar, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/ml/$kind")({
  head: ({ params }) => ({ meta: [{ title: `ML — ${params.kind} · ALPHADESK` }] }),
  component: MLPage,
});

const MODELS: Record<string, { title: string; subtitle: string; description: string }> = {
  xgboost: {
    title: "XGBoost-style Logistic Ensemble",
    subtitle: "Probability-based ranking model.",
    description: "Combines 8 normalized features (growth, ROE, margin, momentum, valuation, debt, low-vol, Sharpe) using fitted logistic coefficients. Output is squashed 0–100. Used for ranking, not classification.",
  },
  "random-forest": {
    title: "Random Forest (3-class softmax)",
    subtitle: "Classifies stocks: Strong Buy / Buy / Avoid.",
    description: "Same feature vector as XGBoost, but processed through a softmax of three calibrated logits. Returns class probabilities you can interpret directly.",
  },
  "decision-tree": {
    title: "Decision Tree Explainer",
    subtitle: "Human-readable rules per stock.",
    description: "Walks each stock through a transparent pass/fail tree (growth → quality → valuation → momentum → risk). Use this to understand why a stock made or missed the cut.",
  },
};

function MLPage() {
  const { kind } = Route.useParams();
  const model = MODELS[kind];
  if (!model) throw notFound();

  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights).slice(0, 25), [market, weights]);

  return (
    <Page title={model.title} subtitle={model.subtitle} badge="ML">
      <Panel title="How this model works">
        <div className="text-sm text-muted-foreground leading-relaxed">{model.description}</div>
        <div className="text-[10px] text-[var(--warning)] mt-2">⚠ This model does NOT guarantee returns. It ranks and filters; final decisions remain yours.</div>
      </Panel>

      <div className="mt-4">
        <Panel title="Ranked Output">
          {kind === "decision-tree" ? (
            <div className="space-y-1.5">
              {rows.map((r) => {
                const p = r.metrics;
                const path: string[] = [];
                path.push(`Growth ${((p.earningsGrowth ?? 0) * 100).toFixed(0)}% → ${(p.earningsGrowth ?? 0) > 0.10 ? "PASS" : "FAIL"}`);
                path.push(`ROE ${((p.returnOnEquity ?? 0) * 100).toFixed(0)}% → ${(p.returnOnEquity ?? 0) > 0.15 ? "PASS" : "FAIL"}`);
                path.push(`P/E ${(p.trailingPE ?? 0).toFixed(0)} → ${(p.trailingPE ?? 99) < 30 ? "PASS" : "FAIL"}`);
                path.push(`6m mom ${((p.return6m ?? 0) * 100).toFixed(0)}% → ${(p.return6m ?? 0) > 0 ? "PASS" : "FAIL"}`);
                return (
                  <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="block p-2 rounded border border-border/40 hover:bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</span>
                      <ScorePill score={r.scores.ml} label="ML" />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">{path.join("  →  ")}</div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rows.map((r, i) => (
                <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }}>
                  <div className="flex items-center justify-between p-2 rounded border border-border/40 hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
                      <div>
                        <div className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</div>
                        {kind === "random-forest" ? (
                          <div className="text-[10px] text-muted-foreground">SB {(r.scores.mlDetails.probStrongBuy * 100).toFixed(0)}% · B {(r.scores.mlDetails.probBuy * 100).toFixed(0)}% · A {(r.scores.mlDetails.probAvoid * 100).toFixed(0)}%</div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">{r.entry.sector}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20"><Bar value={r.scores.ml} /></div>
                      <ScorePill score={r.scores.ml} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <DataSource source={`${model.title} · transparent coefficients`} />
        </Panel>
      </div>
    </Page>
  );
}
