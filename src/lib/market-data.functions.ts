import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Lazy import to keep client bundle clean.
async function yf() {
  const mod = await import("yahoo-finance2");
  // The default export is a singleton with .quote/.historical/.quoteSummary
  return mod.default;
}

const SymbolInput = z.object({ symbol: z.string().min(1).max(20) });
const SymbolsInput = z.object({ symbols: z.array(z.string().min(1).max(20)).min(1).max(50) });

export type QuoteLite = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  marketCap: number | null;
  volume: number | null;
  currency: string | null;
  shortName: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SymbolsInput.parse(d))
  .handler(async ({ data }): Promise<{ quotes: QuoteLite[]; error: string | null }> => {
    try {
      const y = await yf();
      const results = await y.quote(data.symbols, {}, { validateResult: false }) as unknown[];
      const arr = Array.isArray(results) ? results : [results];
      const quotes: QuoteLite[] = arr.map((q: any) => ({
        symbol: q?.symbol ?? "",
        price: q?.regularMarketPrice ?? null,
        change: q?.regularMarketChange ?? null,
        changePct: q?.regularMarketChangePercent ?? null,
        marketCap: q?.marketCap ?? null,
        volume: q?.regularMarketVolume ?? null,
        currency: q?.currency ?? null,
        shortName: q?.shortName ?? q?.longName ?? null,
        fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: q?.fiftyTwoWeekLow ?? null,
      }));
      return { quotes, error: null };
    } catch (err) {
      console.error("getQuotes failed:", err);
      return { quotes: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  });

export type HistoryPoint = { date: string; close: number; volume: number };

export const getHistory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SymbolInput.parse(d))
  .handler(async ({ data }): Promise<{ symbol: string; points: HistoryPoint[]; error: string | null }> => {
    try {
      const y = await yf();
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 2);
      const rows = (await y.historical(data.symbol, { period1: start, period2: end, interval: "1d" })) as Array<{ date: Date; close: number | null; volume: number | null }>;
      const points = rows
        .filter((r) => r.close != null)
        .map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          close: r.close as number,
          volume: r.volume ?? 0,
        }));
      return { symbol: data.symbol, points, error: null };
    } catch (err) {
      console.error("getHistory failed:", err);
      return { symbol: data.symbol, points: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  });

export type Fundamentals = {
  symbol: string;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  beta: number | null;
  marketCap: number | null;
  enterpriseToEbitda: number | null;
  profitMargins: number | null;
  operatingMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  freeCashflow: number | null;
  sector: string | null;
  industry: string | null;
  longBusinessSummary: string | null;
};

export const getFundamentals = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SymbolInput.parse(d))
  .handler(async ({ data }): Promise<{ fundamentals: Fundamentals | null; error: string | null }> => {
    try {
      const y = await yf();
      const sum = await y.quoteSummary(data.symbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"],
      }) as any;
      const sd = sum?.summaryDetail ?? {};
      const ks = sum?.defaultKeyStatistics ?? {};
      const fd = sum?.financialData ?? {};
      const ap = sum?.assetProfile ?? {};
      return {
        fundamentals: {
          symbol: data.symbol,
          trailingPE: sd?.trailingPE ?? null,
          forwardPE: sd?.forwardPE ?? null,
          priceToBook: ks?.priceToBook ?? null,
          dividendYield: sd?.dividendYield ?? null,
          beta: sd?.beta ?? null,
          marketCap: sd?.marketCap ?? null,
          enterpriseToEbitda: ks?.enterpriseToEbitda ?? null,
          profitMargins: fd?.profitMargins ?? null,
          operatingMargins: fd?.operatingMargins ?? null,
          returnOnEquity: fd?.returnOnEquity ?? null,
          returnOnAssets: fd?.returnOnAssets ?? null,
          debtToEquity: fd?.debtToEquity != null ? fd.debtToEquity / 100 : null,
          currentRatio: fd?.currentRatio ?? null,
          revenueGrowth: fd?.revenueGrowth ?? null,
          earningsGrowth: fd?.earningsGrowth ?? null,
          freeCashflow: fd?.freeCashflow ?? null,
          sector: ap?.sector ?? null,
          industry: ap?.industry ?? null,
          longBusinessSummary: ap?.longBusinessSummary ?? null,
        },
        error: null,
      };
    } catch (err) {
      console.error("getFundamentals failed:", err);
      return { fundamentals: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  });
