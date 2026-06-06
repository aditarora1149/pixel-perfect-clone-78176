import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Page, Panel, DataSource, Unavailable } from "@/components/common";
import { useAppStore } from "@/stores/app-store";
import { getUniverse } from "@/lib/universe";
import { getNews } from "@/lib/news.functions";
import { Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Sentiment — ALPHADESK" }] }),
  component: NewsPage,
});

function classifySentiment(text: string): { label: "Positive" | "Negative" | "Neutral"; color: string } {
  const t = text.toLowerCase();
  const pos = ["beats", "surge", "record", "growth", "wins", "upgrade", "profit", "rally", "strong", "expansion", "approval"];
  const neg = ["miss", "decline", "loss", "downgrade", "probe", "lawsuit", "weak", "cut", "falls", "drops", "warning", "default"];
  let score = 0;
  for (const w of pos) if (t.includes(w)) score++;
  for (const w of neg) if (t.includes(w)) score--;
  if (score > 0) return { label: "Positive", color: "text-[var(--bull)]" };
  if (score < 0) return { label: "Negative", color: "text-[var(--bear)]" };
  return { label: "Neutral", color: "text-muted-foreground" };
}

function NewsPage() {
  const market = useAppStore((s) => s.market);
  const universe = getUniverse(market);
  const [symbol, setSymbol] = useState<string>(universe[0]?.symbol ?? "RELIANCE.NS");
  const entry = universe.find((u) => u.symbol === symbol) ?? universe[0];
  const fetchNews = useServerFn(getNews);
  const query = `${entry?.name ?? symbol} ${market === "IN" ? "NSE stock" : "stock"}`;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["news", query],
    queryFn: () => fetchNews({ data: { query, limit: 15 } }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Page
      title="News & Sentiment"
      subtitle="Live Google News RSS feed. Sentiment is heuristic (keyword-based) — verify before acting."
      actions={
        <button onClick={() => refetch()} className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90">
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      <Panel>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <label className="text-xs text-muted-foreground">Ticker:</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-secondary border border-border rounded px-2 py-1 text-xs"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol.replace(".NS", "")} — {u.name}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-muted-foreground ml-auto">Query: <code className="bg-secondary px-1 rounded">{query}</code></span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching live headlines…
          </div>
        )}

        {isError && <Unavailable reason="News feed temporarily unreachable. Try refreshing in a moment." />}

        {data?.error && <Unavailable reason={data.error} />}

        {data?.items && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((n, i) => {
              const sent = classifySentiment(n.title + " " + n.snippet);
              return (
                <a
                  key={i}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded border border-border/40 hover:border-primary/60 hover:bg-secondary/40 transition"
                >
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 flex-wrap">
                    <Link
                      to="/stock/$symbol"
                      params={{ symbol: entry?.symbol ?? symbol }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary font-semibold"
                    >
                      {(entry?.symbol ?? symbol).replace(".NS", "")}
                    </Link>
                    <span>·</span>
                    <span>{n.source}</span>
                    <span>·</span>
                    <span>{new Date(n.pubDate).toLocaleString()}</span>
                    <span className={`ml-auto font-semibold ${sent.color}`}>{sent.label}</span>
                  </div>
                  <div className="text-sm font-medium flex items-start gap-2">
                    <span className="flex-1">{n.title}</span>
                    <ExternalLink className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
                  </div>
                  {n.snippet && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.snippet}</div>}
                </a>
              );
            })}
          </div>
        )}

        <DataSource source="Google News RSS · free public feed · sentiment is heuristic" />
      </Panel>
    </Page>
  );
}
