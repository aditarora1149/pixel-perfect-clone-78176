import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { findEntry } from "@/lib/universe";

export const Route = createFileRoute("/rejected")({
  head: () => ({ meta: [{ title: "Rejected Stocks — ALPHADESK" }] }),
  component: RejectedPage,
});

function RejectedPage() {
  const rejected = useAppStore((s) => s.rejected);
  const reasons = useAppStore((s) => s.rejectReasons);
  const unreject = useAppStore((s) => s.unreject);

  return (
    <Page title="Rejected Stocks" subtitle="Stocks you've manually removed from consideration, with reasons for the audit trail.">
      <Panel>
        {rejected.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No rejected stocks yet.</div>
        ) : (
          <div className="space-y-1">
            {rejected.map((sym) => {
              const e = findEntry(sym);
              return (
                <div key={sym} className="flex items-center gap-3 p-2 rounded border border-border/40">
                  <Link to="/stock/$symbol" params={{ symbol: sym }} className="font-semibold hover:text-primary w-32">{sym.replace(".NS", "")}</Link>
                  <span className="text-xs text-muted-foreground flex-1">{e?.name ?? sym}</span>
                  <span className="text-xs text-[var(--bear)] italic">{reasons[sym] ?? "Manual reject"}</span>
                  <button onClick={() => unreject(sym)} className="text-[10px] px-2 py-1 bg-secondary rounded hover:bg-primary hover:text-primary-foreground">Restore</button>
                </div>
              );
            })}
          </div>
        )}
        <DataSource source="Local browser storage (persistent)" />
      </Panel>
    </Page>
  );
}
