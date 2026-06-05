import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";
import { useMemo } from "react";

export const Route = createFileRoute("/risk-3d")({
  head: () => ({ meta: [{ title: "3D Risk Universe — ALPHADESK" }] }),
  component: Risk3DPage,
});

function Risk3DPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const rows = useMemo(() => rankUniverse(market, weights), [market, weights]);

  // SVG isometric "3D" projection: X = valuation, Y = momentum, Z = volatility (radius)
  const W = 800, H = 500;
  const project = (val: number, mom: number, _vol: number) => {
    const x = 50 + (val / 100) * (W - 100);
    const y = H - 50 - (mom / 100) * (H - 100);
    return { x, y };
  };

  return (
    <Page title="3D Risk / Return Universe" subtitle="X = valuation score, Y = momentum, bubble size = inverse volatility. Hover for details.">
      <Panel>
        <svg width={W} height={H} className="w-full max-w-full">
          <line x1="50" y1={H - 50} x2={W - 50} y2={H - 50} stroke="var(--muted-foreground)" strokeOpacity="0.3" />
          <line x1="50" y1="50" x2="50" y2={H - 50} stroke="var(--muted-foreground)" strokeOpacity="0.3" />
          <text x={W / 2} y={H - 15} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Valuation →</text>
          <text x="20" y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90 20 ${H / 2})`}>Momentum →</text>

          {rows.map((r) => {
            const { x, y } = project(r.scores.valuation, r.scores.quantitative, (r.metrics.volatility ?? 0.3) * 100);
            const radius = Math.max(4, 16 - (r.metrics.volatility ?? 0.3) * 18);
            const color = r.scores.composite >= 70 ? "var(--bull)" : r.scores.composite >= 50 ? "var(--primary)" : "var(--bear)";
            return (
              <g key={r.entry.symbol}>
                <circle cx={x} cy={y} r={radius} fill={color} fillOpacity="0.35" stroke={color} strokeWidth="1.5" />
                <text x={x} y={y - radius - 2} textAnchor="middle" fontSize="9" fill="var(--foreground)" opacity="0.6">{r.entry.symbol.replace(".NS", "")}</text>
                <title>{`${r.entry.name}\nValuation: ${r.scores.valuation.toFixed(0)} | Momentum: ${r.scores.quantitative.toFixed(0)} | Vol: ${((r.metrics.volatility ?? 0) * 100).toFixed(0)}%`}</title>
              </g>
            );
          })}
        </svg>
        <DataSource source="Projection of computed scores · interactive Three.js view coming in next iteration" />
      </Panel>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded border border-[var(--bull)]/40 bg-[var(--bull)]/5"><strong className="text-[var(--bull)]">Top-right corner</strong> = cheap + strong momentum (best quadrant).</div>
        <div className="p-3 rounded border border-[var(--warning)]/40 bg-[var(--warning)]/5"><strong className="text-[var(--warning)]">Top-left</strong> = expensive but strong momentum (momentum risk).</div>
        <div className="p-3 rounded border border-[var(--bear)]/40 bg-[var(--bear)]/5"><strong className="text-[var(--bear)]">Bottom-left</strong> = expensive + weak (avoid).</div>
      </div>
    </Page>
  );
}
