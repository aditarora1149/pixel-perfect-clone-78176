import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel } from "@/components/common";
import { EDU } from "@/lib/education";

export const Route = createFileRoute("/education")({
  head: () => ({ meta: [{ title: "Learn — ALPHADESK" }] }),
  component: EducationPage,
});

const GROUPS = [
  { title: "Modules", keys: ["fundamental", "valuation", "quant", "technical", "qualitative", "ml", "composite"] },
  { title: "Valuation Ratios", keys: ["pe", "pb", "evEbitda", "roe", "debt"] },
  { title: "Technical & Risk", keys: ["rsi", "sma", "sharpe", "drawdown", "beta"] },
  { title: "Simulation", keys: ["monteCarlo", "varCvar"] },
];

function EducationPage() {
  return (
    <Page title="Learn — Every concept in plain English" subtitle="Written for students. One sentence, one example, one investor takeaway.">
      {GROUPS.map((g) => (
        <div key={g.title} className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">{g.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {g.keys.map((k) => {
              const e = EDU[k];
              if (!e) return null;
              return (
                <Panel key={k}>
                  <div className="font-semibold text-sm text-primary mb-1">{e.term}</div>
                  <div className="text-xs text-foreground/90 mb-2">{e.definition}</div>
                  <div className="text-[11px] text-muted-foreground mb-1"><strong>Example:</strong> {e.example}</div>
                  <div className="text-[11px] text-foreground/80"><strong className="text-[var(--bull)]">Why it matters:</strong> {e.takeaway}</div>
                </Panel>
              );
            })}
          </div>
        </div>
      ))}
    </Page>
  );
}
