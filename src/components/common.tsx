import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Page({
  title,
  subtitle,
  badge,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </AppShell>
  );
}

export function Panel({
  title,
  className,
  children,
  right,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function ScorePill({ score, label }: { score: number; label?: string }) {
  const color =
    score >= 80
      ? "bg-[var(--bull)]/20 text-[var(--bull)] border-[var(--bull)]/40"
      : score >= 65
        ? "bg-primary/20 text-primary border-primary/40"
        : score >= 50
          ? "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/40"
          : "bg-[var(--bear)]/20 text-[var(--bear)] border-[var(--bear)]/40";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border tabular-nums",
        color,
      )}
    >
      {label && <span className="opacity-70 font-medium">{label}</span>}
      {score.toFixed(0)}
    </span>
  );
}

export function MetricRow({
  label,
  value,
  hint,
  positive,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-sm">
      <div>
        <div className="text-muted-foreground">{label}</div>
        {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
      </div>
      <div
        className={cn(
          "font-mono font-semibold tabular-nums",
          positive === true && "text-[var(--bull)]",
          positive === false && "text-[var(--bear)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    value >= 70 ? "var(--bull)" : value >= 50 ? "var(--primary)" : value >= 35 ? "var(--warning)" : "var(--bear)";
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function DataSource({ source, updated }: { source: string; updated?: string }) {
  return (
    <div className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-2">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--bull)] pulse-glow" />
      Source: <span className="text-foreground/70">{source}</span>
      {updated && <span>· Updated: {updated}</span>}
    </div>
  );
}

export function fmtNum(n: number | null | undefined, opts?: { decimals?: number; suffix?: string; currency?: string }) {
  if (n == null || !isFinite(n)) return <span className="text-muted-foreground/60">—</span>;
  const d = opts?.decimals ?? 2;
  const abs = Math.abs(n);
  let v: string;
  if (abs >= 1e12) v = (n / 1e12).toFixed(d) + "T";
  else if (abs >= 1e9) v = (n / 1e9).toFixed(d) + "B";
  else if (abs >= 1e6) v = (n / 1e6).toFixed(d) + "M";
  else v = n.toFixed(d);
  return (
    <span>
      {opts?.currency && <span className="text-muted-foreground/70 text-[10px] mr-0.5">{opts.currency}</span>}
      {v}
      {opts?.suffix}
    </span>
  );
}

export function fmtPct(n: number | null | undefined, decimals = 2) {
  if (n == null || !isFinite(n))
    return <span className="text-muted-foreground/60">—</span>;
  const v = n * 100;
  const positive = v >= 0;
  return (
    <span className={positive ? "text-[var(--bull)]" : "text-[var(--bear)]"}>
      {positive ? "+" : ""}
      {v.toFixed(decimals)}%
    </span>
  );
}

export function Unavailable({ reason }: { reason?: string }) {
  return (
    <div className="rounded border border-dashed border-[var(--warning)]/40 bg-[var(--warning)]/5 px-3 py-2 text-xs text-[var(--warning)]">
      {reason ?? "Data unavailable — requires manual verification."}
    </div>
  );
}
