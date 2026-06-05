import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { findEntry } from "@/lib/universe";
import { computeAllScores, seedMetrics } from "@/lib/scoring";
import { Star, X } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — ALPHADESK" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const watch = useAppStore((s) => s.watchlist);
  const toggle = useAppStore((s) => s.toggleWatch);
  const weights = useAppStore((s) => s.weights);

  const rows = watch
    .map((sym) => findEntry(sym))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map((entry) => {
      const m = seedMetrics(entry.symbol, entry.sector);
      return { entry, scores: computeAllScores(m, entry, weights) };
    });

  return (
    <Page title="Watchlist" subtitle="Track candidates without committing capital. Add stars from any stock page.">
      <Panel>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Watchlist is empty. Open any stock and click the star icon.
          </div>
        ) : (
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.entry.symbol} className="flex items-center gap-3 p-2 rounded border border-border/40 hover:bg-secondary/30">
                <button onClick={() => toggle(r.entry.symbol)} className="text-muted-foreground hover:text-[var(--bear)]" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
                <Link to="/stock/$symbol" params={{ symbol: r.entry.symbol }} className="font-semibold hover:text-primary flex-1">
                  {r.entry.symbol.replace(".NS", "")}
                  <span className="ml-2 text-[10px] text-muted-foreground">{r.entry.name}</span>
                </Link>
                <span className="text-xs text-muted-foreground">{r.entry.sector}</span>
                <ScorePill score={r.scores.composite} />
              </div>
            ))}
          </div>
        )}
        <DataSource source="Local browser storage (persistent)" />
      </Panel>
    </Page>
  );
}
