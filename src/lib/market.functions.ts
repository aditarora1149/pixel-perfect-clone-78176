// Real market-data fetcher. Pulls live quotes + fundamentals from Finnhub
// (US), FMP (IN+US), and Alpha Vantage (fallback). Caches results in the
// `stock_metrics_cache` table for 24 hours so we stay inside free-tier limits.
//
// Returns metrics in the exact shape `scoring.ts` expects, plus a `meta`
// object the UI can use to render LIVE/STALE/UNAVAILABLE badges and source
// attribution. Any field that could not be fetched stays `null` — never
// guessed or filled with synthetic numbers.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { StockMetrics } from "./scoring";

const Input = z.object({
  symbol: z.string().min(1).max(20),
  market: z.enum(["IN", "US"]),
  force: z.boolean().optional(),
});

export type MetricsSourceMap = Partial<Record<keyof StockMetrics, string>>;

export type MetricsFetchResult = {
  symbol: string;
  metrics: StockMetrics;
  meta: {
    status: "LIVE" | "STALE" | "PARTIAL" | "UNAVAILABLE";
    fetchedAt: string;        // ISO
    ageMinutes: number;
    primarySource: string;    // e.g. "Finnhub + FMP"
    sources: MetricsSourceMap;
    errors: string[];
    cacheHit: boolean;
  };
};

const CACHE_TTL_MIN = 60 * 24; // 24h

const EMPTY: StockMetrics = {
  price: null, marketCap: null, beta: null,
  trailingPE: null, forwardPE: null, priceToBook: null,
  evToEbitda: null, dividendYield: null,
  revenueGrowth: null, earningsGrowth: null,
  profitMargins: null, operatingMargins: null,
  returnOnEquity: null, returnOnAssets: null,
  debtToEquity: null, currentRatio: null, freeCashflow: null,
  return1m: null, return3m: null, return6m: null, return1y: null,
  volatility: null, rsi14: null, sma50Above200: null,
  maxDrawdown: null, sharpe: null, avgVolume: null,
  pctFrom52wHigh: null, pctFrom52wLow: null,
};

function num(x: unknown): number | null {
  if (x == null) return null;
  const n = typeof x === "string" ? parseFloat(x) : (x as number);
  return Number.isFinite(n) ? n : null;
}

async function fetchJSON(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// ---------- providers ----------

async function fromFinnhub(symbol: string): Promise<{ partial: Partial<StockMetrics>; sources: MetricsSourceMap; err?: string }> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { partial: {}, sources: {}, err: "FINNHUB_API_KEY missing" };
  try {
    const [quote, metric] = await Promise.all([
      fetchJSON(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`),
      fetchJSON(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key}`),
    ]);
    const m = metric?.metric ?? {};
    const partial: Partial<StockMetrics> = {
      price: num(quote?.c),
      marketCap: num(m.marketCapitalization) != null ? (num(m.marketCapitalization)! * 1_000_000) : null,
      beta: num(m.beta),
      trailingPE: num(m.peTTM ?? m.peNormalizedAnnual),
      forwardPE: num(m.peExclExtraTTM),
      priceToBook: num(m.pbAnnual ?? m.pbQuarterly),
      evToEbitda: num(m.enterpriseValueOverEBITDATTM),
      dividendYield: num(m.dividendYieldIndicatedAnnual) != null ? num(m.dividendYieldIndicatedAnnual)! / 100 : null,
      revenueGrowth: num(m.revenueGrowthTTMYoy) != null ? num(m.revenueGrowthTTMYoy)! / 100 : null,
      earningsGrowth: num(m.epsGrowthTTMYoy) != null ? num(m.epsGrowthTTMYoy)! / 100 : null,
      profitMargins: num(m.netProfitMarginTTM) != null ? num(m.netProfitMarginTTM)! / 100 : null,
      operatingMargins: num(m.operatingMarginTTM) != null ? num(m.operatingMarginTTM)! / 100 : null,
      returnOnEquity: num(m.roeTTM) != null ? num(m.roeTTM)! / 100 : null,
      returnOnAssets: num(m.roaTTM) != null ? num(m.roaTTM)! / 100 : null,
      debtToEquity: num(m.totalDebt2EquityAnnual ?? m["totalDebt/totalEquityAnnual"]),
      currentRatio: num(m.currentRatioAnnual),
      freeCashflow: num(m.freeCashFlowTTM),
      pctFrom52wHigh: num(m["52WeekHigh"]) && num(quote?.c)
        ? (num(quote.c)! - num(m["52WeekHigh"])!) / num(m["52WeekHigh"])!
        : null,
      pctFrom52wLow: num(m["52WeekLow"]) && num(quote?.c)
        ? (num(quote.c)! - num(m["52WeekLow"])!) / num(m["52WeekLow"])!
        : null,
    };
    const sources: MetricsSourceMap = {};
    for (const k of Object.keys(partial) as (keyof StockMetrics)[]) {
      if (partial[k] != null) sources[k] = "Finnhub";
    }
    return { partial, sources };
  } catch (e) {
    return { partial: {}, sources: {}, err: `Finnhub: ${(e as Error).message}` };
  }
}

async function fromFMP(symbol: string): Promise<{ partial: Partial<StockMetrics>; sources: MetricsSourceMap; history: number[]; err?: string }> {
  const key = process.env.FMP_API_KEY;
  if (!key) return { partial: {}, sources: {}, history: [], err: "FMP_API_KEY missing" };
  try {
    const [quoteArr, ratios, keyMetrics, profile, hist] = await Promise.all([
      fetchJSON(`https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${key}`),
      fetchJSON(`https://financialmodelingprep.com/api/v3/ratios-ttm/${encodeURIComponent(symbol)}?apikey=${key}`),
      fetchJSON(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${encodeURIComponent(symbol)}?apikey=${key}`),
      fetchJSON(`https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${key}`),
      fetchJSON(`https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?serietype=line&timeseries=300&apikey=${key}`),
    ]);
    const q = Array.isArray(quoteArr) ? quoteArr[0] : null;
    const r = Array.isArray(ratios) ? ratios[0] : null;
    const km = Array.isArray(keyMetrics) ? keyMetrics[0] : null;
    const p = Array.isArray(profile) ? profile[0] : null;
    const closes: number[] = Array.isArray(hist?.historical)
      ? hist.historical.map((d: any) => num(d.close)).filter((v: number | null): v is number => v != null).reverse()
      : [];

    const partial: Partial<StockMetrics> = {
      price: num(q?.price),
      marketCap: num(q?.marketCap),
      beta: num(p?.beta),
      trailingPE: num(q?.pe ?? r?.peRatioTTM),
      forwardPE: null,
      priceToBook: num(r?.priceToBookRatioTTM ?? km?.pbRatioTTM),
      evToEbitda: num(km?.enterpriseValueOverEBITDATTM),
      dividendYield: num(r?.dividendYielTTM ?? r?.dividendYieldTTM),
      profitMargins: num(r?.netProfitMarginTTM),
      operatingMargins: num(r?.operatingProfitMarginTTM),
      returnOnEquity: num(r?.returnOnEquityTTM),
      returnOnAssets: num(r?.returnOnAssetsTTM),
      debtToEquity: num(r?.debtEquityRatioTTM),
      currentRatio: num(r?.currentRatioTTM),
      freeCashflow: num(km?.freeCashFlowTTM),
      avgVolume: num(q?.avgVolume),
      pctFrom52wHigh: num(q?.price) && num(q?.yearHigh) ? (num(q.price)! - num(q.yearHigh)!) / num(q.yearHigh)! : null,
      pctFrom52wLow: num(q?.price) && num(q?.yearLow) ? (num(q.price)! - num(q.yearLow)!) / num(q.yearLow)! : null,
    };
    const sources: MetricsSourceMap = {};
    for (const k of Object.keys(partial) as (keyof StockMetrics)[]) {
      if (partial[k] != null) sources[k] = "FMP";
    }
    return { partial, sources, history: closes };
  } catch (e) {
    return { partial: {}, sources: {}, history: [], err: `FMP: ${(e as Error).message}` };
  }
}

async function fromYahoo(symbol: string): Promise<{ partial: Partial<StockMetrics>; sources: MetricsSourceMap; history: number[]; err?: string }> {
  try {
    const mod = await import("yahoo-finance2");
    const yf = mod.default;
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 2);

    const [sum, hist, quote] = await Promise.all([
      yf.quoteSummary(symbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile", "price"],
      }).catch(() => null) as any,
      yf.historical(symbol, { period1: start, period2: end, interval: "1d" }).catch(() => []) as any,
      yf.quote(symbol).catch(() => null) as any,
    ]);

    const sd = sum?.summaryDetail ?? {};
    const ks = sum?.defaultKeyStatistics ?? {};
    const fd = sum?.financialData ?? {};
    const px = sum?.price ?? {};

    const closes: number[] = Array.isArray(hist)
      ? hist.filter((r: any) => r?.close != null).map((r: any) => r.close as number)
      : [];

    const partial: Partial<StockMetrics> = {
      price: num(quote?.regularMarketPrice ?? px?.regularMarketPrice),
      marketCap: num(quote?.marketCap ?? sd?.marketCap),
      beta: num(sd?.beta ?? ks?.beta),
      trailingPE: num(sd?.trailingPE),
      forwardPE: num(sd?.forwardPE),
      priceToBook: num(ks?.priceToBook),
      evToEbitda: num(ks?.enterpriseToEbitda),
      dividendYield: num(sd?.dividendYield),
      profitMargins: num(fd?.profitMargins),
      operatingMargins: num(fd?.operatingMargins),
      returnOnEquity: num(fd?.returnOnEquity),
      returnOnAssets: num(fd?.returnOnAssets),
      debtToEquity: num(fd?.debtToEquity) != null ? num(fd.debtToEquity)! / 100 : null,
      currentRatio: num(fd?.currentRatio),
      revenueGrowth: num(fd?.revenueGrowth),
      earningsGrowth: num(fd?.earningsGrowth),
      freeCashflow: num(fd?.freeCashflow),
      avgVolume: num(quote?.averageDailyVolume3Month ?? sd?.averageDailyVolume10Day),
    };
    const sources: MetricsSourceMap = {};
    for (const k of Object.keys(partial) as (keyof StockMetrics)[]) {
      if (partial[k] != null) sources[k] = "Yahoo Finance";
    }
    return { partial, sources, history: closes };
  } catch (e) {
    return { partial: {}, sources: {}, history: [], err: `Yahoo: ${(e as Error).message}` };
  }
}



function computeTechnicals(closes: number[]): Partial<StockMetrics> {
  if (closes.length < 30) return {};
  const last = closes[closes.length - 1];
  const at = (daysAgo: number) => closes[closes.length - 1 - daysAgo] ?? null;
  const ret = (daysAgo: number) => {
    const past = at(daysAgo);
    return past ? (last - past) / past : null;
  };
  // daily returns
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  const dailyVol = Math.sqrt(variance);
  const annVol = dailyVol * Math.sqrt(252);
  const annRet = mean * 252;
  const sharpe = annVol > 0 ? (annRet - 0.04) / annVol : null;

  // RSI(14) on last 14 daily moves
  let gains = 0, losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch > 0) gains += ch; else losses -= ch;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  const rsi = 100 - 100 / (1 + rs);

  // SMA50 vs SMA200
  const sma = (n: number) => {
    if (closes.length < n) return null;
    const slice = closes.slice(-n);
    return slice.reduce((a, b) => a + b, 0) / n;
  };
  const s50 = sma(50), s200 = sma(200);

  // Max drawdown over window
  let peak = closes[0], maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (c - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  // 52w high/low from window
  const hi = Math.max(...closes);
  const lo = Math.min(...closes);

  return {
    return1m: ret(21),
    return3m: ret(63),
    return6m: ret(126),
    return1y: ret(252),
    volatility: annVol,
    rsi14: rsi,
    sma50Above200: s50 != null && s200 != null ? s50 > s200 : null,
    maxDrawdown: maxDD,
    sharpe,
    pctFrom52wHigh: (last - hi) / hi,
    pctFrom52wLow: (last - lo) / lo,
  };
}

// ---------- cache layer ----------

async function readCache(symbol: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("stock_metrics_cache")
    .select("data, source, fetched_at")
    .eq("symbol", symbol)
    .maybeSingle();
  if (error || !data) return null;
  return data as { data: any; source: string; fetched_at: string };
}

async function writeCache(symbol: string, market: "IN" | "US", payload: any, source: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("stock_metrics_cache").upsert({
    symbol, market, data: payload, source, fetched_at: new Date().toISOString(),
  });
}

// ---------- main server fn ----------

export const getRealMetrics = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<MetricsFetchResult> => {
    const { symbol, market, force } = data;

    // Cache check
    if (!force) {
      const cached = await readCache(symbol);
      if (cached) {
        const ageMin = (Date.now() - new Date(cached.fetched_at).getTime()) / 60000;
        if (ageMin < CACHE_TTL_MIN) {
          const meta = cached.data?.meta ?? {};
          return {
            symbol,
            metrics: { ...EMPTY, ...(cached.data?.metrics ?? {}) },
            meta: {
              status: ageMin < 60 ? "LIVE" : "STALE",
              fetchedAt: cached.fetched_at,
              ageMinutes: Math.round(ageMin),
              primarySource: cached.source,
              sources: meta.sources ?? {},
              errors: meta.errors ?? [],
              cacheHit: true,
            },
          };
        }
      }
    }

    // Fetch fresh
    const fmp = await fromFMP(symbol);
    const finn = market === "US" ? await fromFinnhub(symbol) : { partial: {}, sources: {} as MetricsSourceMap, err: undefined };

    const technicals = computeTechnicals(fmp.history);
    // Merge: FMP base + Finnhub overrides for fields where FMP lacked data
    const merged: StockMetrics = { ...EMPTY, ...fmp.partial, ...technicals };
    const sources: MetricsSourceMap = { ...fmp.sources };
    for (const k of Object.keys(technicals) as (keyof StockMetrics)[]) {
      if (technicals[k as keyof StockMetrics] != null) sources[k] = "Computed (FMP prices)";
    }
    for (const k of Object.keys(finn.partial) as (keyof StockMetrics)[]) {
      const v = (finn.partial as any)[k];
      if (v != null && merged[k] == null) {
        (merged as any)[k] = v;
        sources[k] = "Finnhub";
      }
    }

    const errors: string[] = [];
    if (fmp.err) errors.push(fmp.err);
    if ((finn as any).err) errors.push((finn as any).err);

    const populated = Object.values(merged).filter((v) => v != null).length;
    const total = Object.keys(merged).length;
    const status: "LIVE" | "PARTIAL" | "UNAVAILABLE" =
      populated === 0 ? "UNAVAILABLE" : populated < total * 0.5 ? "PARTIAL" : "LIVE";

    const primarySource = market === "US" ? "FMP + Finnhub" : "FMP";
    const payload = { metrics: merged, meta: { sources, errors } };

    if (status !== "UNAVAILABLE") {
      try { await writeCache(symbol, market, payload, primarySource); }
      catch (e) { errors.push(`cache write: ${(e as Error).message}`); }
    }

    return {
      symbol,
      metrics: merged,
      meta: {
        status,
        fetchedAt: new Date().toISOString(),
        ageMinutes: 0,
        primarySource,
        sources,
        errors,
        cacheHit: false,
      },
    };
  });
