import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Page, Panel, ScorePill, Bar, DataSource, MetricRow, fmtNum, fmtPct, Unavailable } from "@/components/common";
import { Info } from "@/components/Info";
import { ActionPlanPanel } from "@/components/ActionPlanPanel";
import { DataBadge } from "@/components/DataBadge";
import { useAppStore, weightsForHorizon, type Horizon } from "@/stores/app-store";
import { computeAllScores, seedMetrics, type StockMetrics } from "@/lib/scoring";
import { computeActionPlan } from "@/lib/action-plan";
import { findEntry } from "@/lib/universe";
import { getRealMetrics } from "@/lib/market.functions";
import { useMemo, useState } from "react";
import { Star, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/stock/$symbol")({
  head: ({ params }) => ({ meta: [{ title: `${params.symbol} — Stock Detail` }] }),
  component: StockDetail,
  notFoundComponent: () => <Page title="Stock not found"><Unavailable reason="That symbol is not in the curated universe." /></Page>,
});

const TABS = ["Fundamental", "Valuation", "Quant", "Technical", "Qualitative", "ML", "News", "Risk"] as const;

function StockDetail() {
  const { symbol } = Route.useParams();
  const entry = findEntry(symbol);
  const globalHorizon = useAppStore((s) => s.horizon);
  const watchlist = useAppStore((s) => s.watchlist);
  const toggleWatch = useAppStore((s) => s.toggleWatch);
  const reject = useAppStore((s) => s.reject);
  const [tab, setTab] = useState<typeof TABS[number]>("Fundamental");
  const [stockHorizon, setStockHorizon] = useState<Horizon>(globalHorizon);

  if (!entry) throw notFound();

  const weights = useMemo(() => weightsForHorizon(stockHorizon), [stockHorizon]);
  const m = useMemo(() => seedMetrics(entry.symbol, entry.sector), [entry]);
  const scores = useMemo(() => computeAllScores(m, entry, weights), [m, entry, weights]);
  const plan = useMemo(() => computeActionPlan(m, scores, stockHorizon), [m, scores, stockHorizon]);
  const cur = entry.market === "IN" ? "₹" : "$";
  const isWatched = watchlist.includes(entry.symbol);

  return (
    <Page
      title={entry.name}
      subtitle={`${entry.symbol} · ${entry.exchange} · ${entry.sector} → ${entry.industry}`}
      badge={scores.classification}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => toggleWatch(entry.symbol)} className={`p-2 rounded border ${isWatched ? "bg-[var(--warning)]/20 border-[var(--warning)] text-[var(--warning)]" : "border-border text-muted-foreground hover:text-foreground"}`} aria-label="Watch">
            <Star className="h-4 w-4" fill={isWatched ? "currentColor" : "none"} />
          </button>
          <button onClick={() => { if (confirm(`Reject ${entry.symbol}?`)) reject(entry.symbol, "Manual reject from detail page"); }} className="p-2 rounded border border-border text-muted-foreground hover:text-[var(--bear)]" aria-label="Reject">
            <XCircle className="h-4 w-4" />
          </button>
          <ScorePill score={scores.composite} label="Composite" />
        </div>
      }
    >
      <div className="mb-4">
        <ActionPlanPanel plan={plan} currency={cur} horizon={stockHorizon} onHorizonChange={setStockHorizon} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        {([
          ["Fundamental", scores.fundamental, "fundamental"],
          ["Valuation", scores.valuation, "valuation"],
          ["Quant", scores.quantitative, "quant"],
          ["Technical", scores.technical, "technical"],
          ["Qualitative", scores.qualitative, "qualitative"],
          ["ML", scores.ml, "ml"],
        ] as const).map(([label, score, key]) => (
          <Panel key={label}>
            <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">{label} <Info k={key} /></div>
            <div className="text-xl font-bold tabular-nums">{score.toFixed(0)}</div>
            <Bar value={score} />
          </Panel>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Price & Levels">
          <MetricRow label="Last price" value={<>{cur}{fmtNum(m.price)}</>} />
          <MetricRow label="Market cap" value={fmtNum(m.marketCap, { currency: cur })} />
          <MetricRow label="52w high" value={<>{cur}{fmtNum(m.price ? m.price / (1 + (m.pctFrom52wHigh ?? 0)) : null)}</>} />
          <MetricRow label="52w low" value={<>{cur}{fmtNum(m.price && m.pctFrom52wLow ? m.price / (1 + m.pctFrom52wLow) : null)}</>} />
          <MetricRow label="Beta" value={m.beta?.toFixed(2) ?? "—"} />
          <MetricRow label="Avg volume" value={fmtNum(m.avgVolume)} />
          <DataSource source="Yahoo Finance (seed)" />
        </Panel>

        {tab === "Fundamental" && (
          <Panel title="Fundamental Breakdown" className="lg:col-span-2">
            <MetricRow label="Revenue growth (1y)" value={fmtPct(m.revenueGrowth)} positive={(m.revenueGrowth ?? 0) > 0} />
            <MetricRow label="Earnings growth (1y)" value={fmtPct(m.earningsGrowth)} positive={(m.earningsGrowth ?? 0) > 0} />
            <MetricRow label="Return on equity" value={fmtPct(m.returnOnEquity)} />
            <MetricRow label="Profit margin" value={fmtPct(m.profitMargins)} />
            <MetricRow label="Operating margin" value={fmtPct(m.operatingMargins)} />
            <MetricRow label="Debt / Equity" value={m.debtToEquity?.toFixed(2) ?? "—"} positive={(m.debtToEquity ?? 99) < 1} />
            <MetricRow label="Current ratio" value={m.currentRatio?.toFixed(2) ?? "—"} />
            <MetricRow label="Free cash flow" value={fmtNum(m.freeCashflow, { currency: cur })} />
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="text-xs text-muted-foreground mb-2">Score components</div>
              {Object.entries(scores.fundamentalParts).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs my-1">
                  <span className="w-28 text-muted-foreground">{k}</span>
                  <Bar value={v} />
                  <span className="font-mono w-8 text-right">{v.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Valuation" && (
          <Panel title="Valuation Breakdown" className="lg:col-span-2">
            <div className="text-sm font-semibold mb-2 text-primary">{scores.valuationVerdict}</div>
            <MetricRow label="Trailing P/E" value={m.trailingPE?.toFixed(1) ?? "—"} />
            <MetricRow label="Forward P/E" value={m.forwardPE?.toFixed(1) ?? "—"} />
            <MetricRow label="Price / Book" value={m.priceToBook?.toFixed(2) ?? "—"} />
            <MetricRow label="EV / EBITDA" value={m.evToEbitda?.toFixed(1) ?? "—"} />
            <MetricRow label="Dividend yield" value={fmtPct(m.dividendYield)} />
            <div className="mt-3 pt-3 border-t border-border/40">
              {Object.entries(scores.valuationParts).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs my-1">
                  <span className="w-28 text-muted-foreground">{k}</span>
                  <Bar value={v} />
                  <span className="font-mono w-8 text-right">{v.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Quant" && (
          <Panel title="Quant Factors" className="lg:col-span-2">
            <MetricRow label="Return 1m" value={fmtPct(m.return1m)} />
            <MetricRow label="Return 3m" value={fmtPct(m.return3m)} />
            <MetricRow label="Return 6m" value={fmtPct(m.return6m)} />
            <MetricRow label="Return 1y" value={fmtPct(m.return1y)} />
            <MetricRow label="Volatility (ann.)" value={fmtPct(m.volatility)} />
            <MetricRow label="Sharpe ratio" value={m.sharpe?.toFixed(2) ?? "—"} />
            <MetricRow label="Max drawdown" value={fmtPct(m.maxDrawdown)} />
            <div className="mt-3 pt-3 border-t border-border/40">
              {Object.entries(scores.quantParts).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs my-1">
                  <span className="w-28 text-muted-foreground">{k}</span>
                  <Bar value={v} />
                  <span className="font-mono w-8 text-right">{v.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Technical" && (
          <Panel title="Technical Setup" className="lg:col-span-2">
            <MetricRow label="RSI(14)" value={m.rsi14?.toFixed(1) ?? "—"} />
            <MetricRow label="SMA50 above SMA200" value={m.sma50Above200 ? "Yes — bullish" : "No — bearish"} positive={!!m.sma50Above200} />
            <MetricRow label="% from 52w high" value={fmtPct(m.pctFrom52wHigh)} />
            <MetricRow label="% from 52w low" value={fmtPct(m.pctFrom52wLow)} />
            <div className="mt-3 pt-3 border-t border-border/40">
              {Object.entries(scores.technicalParts).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs my-1">
                  <span className="w-28 text-muted-foreground">{k}</span>
                  <Bar value={v} />
                  <span className="font-mono w-8 text-right">{v.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Qualitative" && (
          <Panel title="Qualitative Notes" className="lg:col-span-2">
            <ul className="space-y-1 text-sm">
              {scores.qualitativeReasons.map((r, i) => (
                <li key={i} className="px-2 py-1.5 rounded bg-secondary/40 text-xs">{r}</li>
              ))}
            </ul>
            <Unavailable reason="Governance, management quality, and moat depth require manual verification from primary filings." />
          </Panel>
        )}

        {tab === "ML" && (
          <Panel title="ML Ensemble" className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center"><div className="text-[10px] text-muted-foreground">Strong Buy</div><div className="text-xl font-bold text-[var(--bull)]">{(scores.mlDetails.probStrongBuy * 100).toFixed(0)}%</div></div>
              <div className="text-center"><div className="text-[10px] text-muted-foreground">Buy</div><div className="text-xl font-bold text-primary">{(scores.mlDetails.probBuy * 100).toFixed(0)}%</div></div>
              <div className="text-center"><div className="text-[10px] text-muted-foreground">Avoid</div><div className="text-xl font-bold text-[var(--bear)]">{(scores.mlDetails.probAvoid * 100).toFixed(0)}%</div></div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">Top features (weighted contribution)</div>
            {scores.mlDetails.topFeatures.slice(0, 8).map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-xs my-1">
                <span className="w-24 text-muted-foreground">{f.name}</span>
                <Bar value={Math.abs(f.weight) * 100 * 5} />
                <span className="font-mono w-12 text-right">{f.value.toFixed(2)}</span>
              </div>
            ))}
          </Panel>
        )}

        {tab === "News" && (
          <Panel title="News & Sentiment" className="lg:col-span-2">
            <Unavailable reason="News feed wired to Google News RSS in next iteration. Manual verification required for active investment decisions." />
          </Panel>
        )}

        {tab === "Risk" && (
          <Panel title="Risk Snapshot" className="lg:col-span-2">
            <MetricRow label="Volatility (ann.)" value={fmtPct(m.volatility)} />
            <MetricRow label="Beta vs index" value={m.beta?.toFixed(2) ?? "—"} />
            <MetricRow label="Max drawdown (1y)" value={fmtPct(m.maxDrawdown)} />
            <MetricRow label="Debt / Equity" value={m.debtToEquity?.toFixed(2) ?? "—"} />
            <Link to="/simulation/monte-carlo" className="text-xs text-primary hover:underline mt-3 block">→ Run Monte Carlo on this stock</Link>
          </Panel>
        )}
      </div>
    </Page>
  );
}
