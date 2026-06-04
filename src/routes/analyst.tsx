import { createFileRoute } from "@tanstack/react-router";
import { Page, Panel } from "@/components/common";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/stores/app-store";
import { rankUniverse } from "@/lib/screener";

export const Route = createFileRoute("/analyst")({
  head: () => ({ meta: [{ title: "AI Investment Analyst — ALPHADESK" }] }),
  component: AnalystPage,
});

const transport = new DefaultChatTransport({ api: "/api/chat" });

const SUGGESTIONS = [
  "Why is the #1 stock ranked first?",
  "Which sectors benefit if INR depreciates?",
  "Compare the top 3 by risk-reward.",
  "What happens to my portfolio if interest rates rise 1%?",
  "Which stock has strongest fundamentals but weak technicals?",
  "Build a conservative ₹10k/week plan.",
];

function AnalystPage() {
  const market = useAppStore((s) => s.market);
  const weights = useAppStore((s) => s.weights);
  const ctx = useRef<string>("");
  useEffect(() => {
    const rows = rankUniverse(market, weights).slice(0, 10);
    ctx.current = `Market: ${market}. Top 10 (composite score):\n` +
      rows.map((r, i) => `${i+1}. ${r.entry.symbol} (${r.entry.name}, ${r.entry.sector}) score=${r.scores.composite.toFixed(1)} F=${r.scores.fundamental.toFixed(0)} V=${r.scores.valuation.toFixed(0)} Q=${r.scores.quantitative.toFixed(0)} T=${r.scores.technical.toFixed(0)} ML=${r.scores.ml.toFixed(0)} class=${r.scores.classification}`).join("\n");
  }, [market, weights]);

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const submit = async (text: string) => {
    if (!text.trim() || status === "submitted" || status === "streaming") return;
    setInput("");
    await sendMessage({ text }, { body: { context: ctx.current } });
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  return (
    <Page title="AI Investment Analyst" subtitle="Grounded in your live scores. Never recommends without showing reasoning, assumptions, and uncertainty." badge="AI · GEMINI">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        <Panel title="Quick questions" className="lg:col-span-1">
          <div className="space-y-1">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => submit(s)} className="w-full text-left text-xs p-2 rounded bg-secondary/40 hover:bg-secondary border border-border/30 hover:border-primary/40">{s}</button>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
            The analyst is grounded with your current Top 10 scores and the engine's transparent rules. It cannot fabricate prices and will say "data unavailable" when a metric is missing.
          </div>
        </Panel>

        <Panel className="lg:col-span-3 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-12">
                <Bot className="h-10 w-10 mx-auto mb-2 text-primary" />
                Ask anything about the universe, scores, scenarios, or portfolio construction.
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                  <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${isUser ? "bg-primary/20" : "bg-secondary"}`}>
                    {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className={`max-w-[80%] ${isUser ? "bg-primary text-primary-foreground rounded-2xl px-4 py-2" : ""}`}>
                    {isUser ? (
                      <div className="text-sm">{text}</div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-sm">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(status === "submitted" || status === "streaming") && messages[messages.length-1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-secondary">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground pulse-glow">Thinking…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="mt-3 flex gap-2 border-t border-border pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the analyst…"
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm"
              autoFocus
            />
            <button type="submit" disabled={status === "submitted" || status === "streaming"} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </Panel>
      </div>
    </Page>
  );
}
