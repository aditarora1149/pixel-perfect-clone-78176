import type { ActionPlan } from "@/lib/action-plan";
import { Panel } from "@/components/common";
import { HORIZONS, type Horizon } from "@/stores/app-store";

export function ActionPlanPanel({
  plan,
  currency,
  horizon,
  onHorizonChange,
}: {
  plan: ActionPlan;
  currency: string;
  horizon: Horizon;
  onHorizonChange?: (h: Horizon) => void;
}) {
  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;
  const confColor =
    plan.confidence === "High" ? "text-[var(--bull)]" : plan.confidence === "Medium" ? "text-primary" : "text-[var(--warning)]";
  const suitColor =
    plan.suitability === "Excellent" ? "text-[var(--bull)]" : plan.suitability === "Good" ? "text-primary" : plan.suitability === "Fair" ? "text-[var(--warning)]" : "text-[var(--bear)]";

  return (
    <Panel title="Action & Timing" right={onHorizonChange && (
      <select
        value={horizon}
        onChange={(e) => onHorizonChange(e.target.value as Horizon)}
        className="text-xs bg-secondary border border-border rounded px-2 py-1"
      >
        {HORIZONS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
      </select>
    )}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Entry zone</div>
          <div className="text-sm font-semibold tabular-nums">{fmt(plan.entryLow)} – {fmt(plan.entryHigh)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Stop-loss</div>
          <div className="text-sm font-semibold tabular-nums text-[var(--bear)]">{fmt(plan.stopLoss)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Target 1</div>
          <div className="text-sm font-semibold tabular-nums text-[var(--bull)]">{fmt(plan.target1)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Target 2</div>
          <div className="text-sm font-semibold tabular-nums text-[var(--bull)]">{fmt(plan.target2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Expected upside</div>
          <div className="text-sm font-semibold text-[var(--bull)]">+{plan.upsidePct[0]}% to +{plan.upsidePct[1]}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Downside risk</div>
          <div className="text-sm font-semibold text-[var(--bear)]">{plan.downsidePct[0]}% to {plan.downsidePct[1]}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Suitability</div>
          <div className={`text-sm font-semibold ${suitColor}`}>{plan.suitability}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Confidence</div>
          <div className={`text-sm font-semibold ${confColor}`}>{plan.confidence}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">Time frame: <span className="text-foreground font-medium">{plan.timeframe}</span></div>

      {plan.notes.length > 0 && (
        <ul className="space-y-1 mt-2">
          {plan.notes.map((n, i) => (
            <li key={i} className="text-xs px-2 py-1.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">⚠ {n}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2 leading-relaxed">
        Research-based plan. Not guaranteed and not direct buy/sell advice. Verify data and consult a registered investment advisor before trading.
      </div>
    </Panel>
  );
}
