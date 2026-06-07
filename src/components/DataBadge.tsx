import { Wifi, WifiOff, AlertTriangle, Clock } from "lucide-react";

export type DataStatus = "LIVE" | "STALE" | "PARTIAL" | "UNAVAILABLE";

export function DataBadge({
  status, source, ageMinutes, errors,
}: {
  status: DataStatus;
  source: string;
  ageMinutes: number;
  errors?: string[];
}) {
  const cfg = {
    LIVE:        { Icon: Wifi,          color: "bg-[var(--bull)]/15 text-[var(--bull)] border-[var(--bull)]/40", label: "LIVE" },
    STALE:       { Icon: Clock,         color: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/40", label: "CACHED" },
    PARTIAL:     { Icon: AlertTriangle, color: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/40", label: "PARTIAL" },
    UNAVAILABLE: { Icon: WifiOff,       color: "bg-[var(--bear)]/15 text-[var(--bear)] border-[var(--bear)]/40", label: "UNAVAILABLE" },
  }[status];

  const ageLabel = ageMinutes < 1 ? "just now"
    : ageMinutes < 60 ? `${ageMinutes}m ago`
    : ageMinutes < 1440 ? `${Math.round(ageMinutes / 60)}h ago`
    : `${Math.round(ageMinutes / 1440)}d ago`;

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wide ${cfg.color}`}>
        <cfg.Icon className="h-3 w-3" />
        {cfg.label}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {source} · fetched {ageLabel}
      </span>
      {errors && errors.length > 0 && (
        <span
          className="text-[10px] text-[var(--bear)] cursor-help"
          title={errors.join("\n")}
        >
          {errors.length} provider error{errors.length > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
