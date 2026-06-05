import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel, DataSource } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { useState } from "react";
import { Bell, X } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — ALPHADESK" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const alerts = useAppStore((s) => s.alerts);
  const addAlert = useAppStore((s) => s.addAlert);
  const removeAlert = useAppStore((s) => s.removeAlert);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<"price-above" | "price-below" | "score-above">("price-above");
  const [value, setValue] = useState("");

  return (
    <Page title="Alerts" subtitle="Notify yourself when a price or score crosses a threshold (local browser alerts).">
      <Panel title="Add Alert">
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="text-[10px] text-muted-foreground">Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="RELIANCE.NS" className="block px-2 py-1.5 bg-secondary border border-border rounded text-sm w-40" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="block px-2 py-1.5 bg-secondary border border-border rounded text-sm">
              <option value="price-above">Price above</option>
              <option value="price-below">Price below</option>
              <option value="score-above">Composite above</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="2800" className="block px-2 py-1.5 bg-secondary border border-border rounded text-sm w-28" />
          </div>
          <button
            onClick={() => { if (symbol && value) { addAlert({ symbol, type, value: Number(value) }); setSymbol(""); setValue(""); } }}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-semibold hover:opacity-90"
          >
            Add
          </button>
        </div>
      </Panel>

      <div className="mt-4">
        <Panel title="Active Alerts">
          {alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <Bell className="h-7 w-7 mx-auto mb-2 opacity-40" /> No alerts yet.
            </div>
          ) : (
            <div className="space-y-1">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded border border-border/40">
                  <span className="font-semibold w-32">{a.symbol}</span>
                  <span className="text-xs text-muted-foreground flex-1">{a.type.replace("-", " ")} {a.value}</span>
                  <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-[var(--bear)]"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
          <DataSource source="Local browser storage (no notifications service)" />
        </Panel>
      </div>
    </Page>
  );
}
