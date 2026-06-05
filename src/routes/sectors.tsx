import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, Bar, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { sectorBuckets } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/sectors")({
  head: () => ({ meta: [{ title: "Sectors — ALPHADESK" }] }),
  component: SectorsIndex,
});

function SectorsIndex() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const buckets = useMemo(() => sectorBuckets(rows), [rows]);

  return (
    <Page title="Sector Analysis" subtitle="Average composite per sector with best-in-class stock. Click any sector to drill in.">
      <Panel>
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <Link key={b.sector} to="/sector/$name" params={{ name: encodeURIComponent(b.sector) }} className="flex items-center gap-3 py-2 px-2 rounded border border-border/30 hover:border-primary/40 hover:bg-secondary/30">
              <div className="w-40">
                <div className="font-semibold text-sm">{b.sector}</div>
                <div className="text-[10px] text-muted-foreground">{b.count} stocks · best: {b.best.entry.symbol.replace(".NS", "")}</div>
              </div>
              <div className="flex-1"><Bar value={b.avgScore} /></div>
              <div className="font-mono tabular-nums text-sm w-12 text-right">{b.avgScore.toFixed(0)}</div>
            </Link>
          ))}
        </div>
        <DataSource source="Sector means of horizon-weighted composite" />
      </Panel>
    </Page>
  );
}
