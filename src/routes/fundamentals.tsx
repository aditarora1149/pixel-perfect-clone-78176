import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, ScorePill, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/fundamentals")({
  head: () => ({ meta: [{ title: "PAGETITLE — ALPHADESK" }] }),
  component: () => {
    const market = useAppStore((s) => s.market);
    const weights = useAppStore((s) => s.weights);
    const rows = useMemo(() => rankUniverse(market, weights).slice(0, 25), [market, weights]);
    return (
      <Page title="PAGETITLE" subtitle="Ranked view from the transparent scoring engine. Click any stock for full breakdown.">
        <Panel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rows.map((r, i) => (
              <Link key={r.entry.symbol} to="/stock/$symbol" params={{ symbol: r.entry.symbol }}>
                <div className="flex items-center justify-between p-2 rounded border border-border/40 hover:border-primary/40 hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
                    <div>
                      <div className="font-semibold text-sm">{r.entry.symbol.replace(".NS", "")}</div>
                      <div className="text-[10px] text-muted-foreground">{r.entry.sector}</div>
                    </div>
                  </div>
                  <ScorePill score={SCOREKEY} />
                </div>
              </Link>
            ))}
          </div>
          <DataSource source="Transparent scoring engine" />
        </Panel>
      </Page>
    );
  },
});
