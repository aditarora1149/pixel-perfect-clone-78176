import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { RiskUniverse3D } from "@/components/three/RiskUniverse3D";
import { useMemo } from "react";

export const Route = createFileRoute("/risk-3d")({
  head: () => ({ meta: [{ title: "3D Risk Universe — ALPHADESK" }] }),
  component: Risk3DPage,
});

function Risk3DPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);

  return (
    <Page
      title="3D Risk / Return Universe"
      subtitle="Interactive Three.js scene · X = Valuation · Y = Momentum · Z = Quality · bubble size = inverse volatility · color = composite score."
    >
      <Panel>
        <RiskUniverse3D rows={rows} />
        <DataSource source="Computed from transparent scoring engine · WebGL rendered" />
      </Panel>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded border border-[var(--bull)]/40 bg-[var(--bull)]/5">
          <strong className="text-[var(--bull)]">Sweet spot</strong> — top-front quadrant: cheap, strong momentum, high quality. Strongest institutional candidates.
        </div>
        <div className="p-3 rounded border border-[var(--warning)]/40 bg-[var(--warning)]/5">
          <strong className="text-[var(--warning)]">Momentum risk</strong> — high Y but low X (expensive). Watch for mean reversion.
        </div>
        <div className="p-3 rounded border border-[var(--bear)]/40 bg-[var(--bear)]/5">
          <strong className="text-[var(--bear)]">Avoid</strong> — back-bottom: weak on every axis. Likely rejected by the screener.
        </div>
      </div>
    </Page>
  );
}
