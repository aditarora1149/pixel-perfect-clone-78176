import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel } from "@/components/common";
import { useAppStore, weightsForHorizon, HORIZONS, type Horizon } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { buildReportHTML, downloadReport } from "@/lib/report";
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report Export — ALPHADESK" }] }),
  component: ReportPage,
});

function ReportPage() {
  const market = useAppStore((s) => s.market);
  const [horizon, setHorizon] = useState<Horizon>(useAppStore.getState().horizon);
  const [sector, setSector] = useState("All");

  const weights = useMemo(() => weightsForHorizon(horizon), [horizon]);
  const ranked = useMemo(() => rankUniverse(market, weights), [market, weights]);
  const sectors = useMemo(() => ["All", ...new Set(ranked.map((r) => r.entry.sector))], [ranked]);
  const filtered = sector === "All" ? ranked : ranked.filter((r) => r.entry.sector === sector);

  const handleExport = () => {
    const html = buildReportHTML({ market, horizon, sector, ranked, filtered });
    downloadReport(html, `alphadesk-${market}-${horizon}-${Date.now()}.html`);
  };

  return (
    <Page title="Export 10-Page PDF Report" subtitle="Auto-generated, student-friendly. Click Export → opens in new tab → use browser Print → Save as PDF.">
      <Panel title="Configure Report">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Horizon</label>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm">
              {HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Sector filter</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="block w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm">
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleExport} className="px-4 py-2 bg-primary text-primary-foreground rounded font-semibold text-sm hover:opacity-90 inline-flex items-center gap-2">
              <FileDown className="h-4 w-4" /> Export 10-page report
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Will include: executive summary, methodology, types of analysis, ML & risk, data sources, workflow map,
          sector summary, custom-selection results, final candidate table (entry/stop/T1/T2), and educational notes & disclaimers.
        </div>
      </Panel>

      <div className="mt-4 text-xs text-muted-foreground p-3 border border-border rounded bg-secondary/20">
        <strong className="text-foreground">Why HTML → PDF?</strong> Pure browser print is free, offline, and renders exactly what you see. No paid PDF libraries required.
      </div>
    </Page>
  );
}
