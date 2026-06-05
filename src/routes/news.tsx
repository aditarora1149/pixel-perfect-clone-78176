import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, Panel, DataSource, Unavailable } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { getUniverse } from "@/lib/universe";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Sentiment — ALPHADESK" }] }),
  component: NewsPage,
});

// Manually curated demo feed — clearly labelled. Real feed plugs into RSS.
const DEMO_FEED = [
  { symbol: "RELIANCE.NS", source: "Exchange Filing", date: "2025-06-04", title: "Reliance announces ₹75,000 cr renewable energy capex", sentiment: "Positive", impact: "Long-term structural" },
  { symbol: "INFY.NS", source: "Moneycontrol", date: "2025-06-03", title: "Infosys wins multi-year deal with European bank", sentiment: "Positive", impact: "Medium-term" },
  { symbol: "TATAMOTORS.NS", source: "ET", date: "2025-06-02", title: "Tata Motors JLR volumes weaker in May", sentiment: "Negative", impact: "Short-term noise" },
  { symbol: "AAPL", source: "Reuters", date: "2025-06-04", title: "Apple unveils on-device AI features at WWDC", sentiment: "Positive", impact: "Long-term structural" },
  { symbol: "TSLA", source: "WSJ", date: "2025-06-03", title: "Tesla Q2 deliveries trending below consensus", sentiment: "Negative", impact: "Medium-term concern" },
];

const SENT_COLOR = { Positive: "text-[var(--bull)]", Negative: "text-[var(--bear)]", Neutral: "text-muted-foreground" } as const;

function NewsPage() {
  const market = useAppStore((s) => s.market);
  const universe = getUniverse(market);
  const items = DEMO_FEED.filter((n) => universe.some((u) => u.symbol === n.symbol));

  return (
    <Page title="News & Sentiment" subtitle="Manually curated demo feed. Every item shows source, date, sentiment, and impact horizon.">
      <Panel>
        <div className="space-y-2">
          {items.map((n, i) => (
            <div key={i} className="p-3 rounded border border-border/40 hover:border-primary/40">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                <Link to="/stock/$symbol" params={{ symbol: n.symbol }} className="text-primary font-semibold">{n.symbol.replace(".NS", "")}</Link>
                <span>·</span><span>{n.source}</span><span>·</span><span>{n.date}</span>
                <span className={`ml-auto font-semibold ${SENT_COLOR[n.sentiment as keyof typeof SENT_COLOR]}`}>{n.sentiment}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground">{n.impact}</span>
              </div>
              <div className="text-sm">{n.title}</div>
            </div>
          ))}
        </div>
        <DataSource source="Manual curation · free public sources only" />
      </Panel>
      <div className="mt-3"><Unavailable reason="Real-time RSS feed wiring is pending. Treat headlines above as demo content for the UI." /></div>
    </Page>
  );
}
