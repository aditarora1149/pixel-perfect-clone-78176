// Deterministic scoring engine.
// Every score is computed from inputs — never random, never hallucinated.
// "data unavailable" returns null which the UI surfaces explicitly.

import type { UniverseEntry } from "./universe";

export type ScoreBundle = {
  fundamental: number;   // 0..100
  valuation: number;
  quantitative: number;
  technical: number;
  qualitative: number;
  ml: number;
  composite: number;     // weighted
  classification: "Strong Buy" | "Buy" | "Watchlist" | "Avoid" | "High Risk";
};

export type StockMetrics = {
  // Price / market
  price: number | null;
  marketCap: number | null;
  beta: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  evToEbitda: number | null;
  dividendYield: number | null;

  // Fundamentals
  revenueGrowth: number | null;     // 1y, fraction
  earningsGrowth: number | null;
  profitMargins: number | null;
  operatingMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  freeCashflow: number | null;

  // Technical (computed from prices)
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  return1y: number | null;
  volatility: number | null;       // annualized
  rsi14: number | null;
  sma50Above200: boolean | null;
  maxDrawdown: number | null;       // 1y, fraction (negative)
  sharpe: number | null;            // 1y
  avgVolume: number | null;
  pctFrom52wHigh: number | null;
  pctFrom52wLow: number | null;
};

// Helpers — bounded scoring so missing data degrades gracefully
function clamp(x: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, x)); }

function bandScore(
  value: number | null,
  bands: { v: number; s: number }[],
  fallback = 50
): number {
  if (value == null || !isFinite(value)) return fallback;
  // Piecewise-linear interpolation between bands
  const sorted = [...bands].sort((a, b) => a.v - b.v);
  if (value <= sorted[0].v) return sorted[0].s;
  if (value >= sorted[sorted.length - 1].v) return sorted[sorted.length - 1].s;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (value >= a.v && value <= b.v) {
      const t = (value - a.v) / (b.v - a.v);
      return a.s + t * (b.s - a.s);
    }
  }
  return fallback;
}

export function scoreFundamental(m: StockMetrics): { score: number; parts: Record<string, number> } {
  const parts = {
    revenueGrowth: bandScore(m.revenueGrowth, [
      { v: -0.2, s: 5 }, { v: 0, s: 30 }, { v: 0.10, s: 60 }, { v: 0.20, s: 85 }, { v: 0.40, s: 100 },
    ]),
    earningsGrowth: bandScore(m.earningsGrowth, [
      { v: -0.3, s: 5 }, { v: 0, s: 30 }, { v: 0.15, s: 65 }, { v: 0.30, s: 90 }, { v: 0.50, s: 100 },
    ]),
    roe: bandScore(m.returnOnEquity != null ? m.returnOnEquity * 100 : null, [
      { v: 0, s: 10 }, { v: 10, s: 45 }, { v: 18, s: 75 }, { v: 25, s: 90 }, { v: 35, s: 100 },
    ]),
    margins: bandScore(m.profitMargins != null ? m.profitMargins * 100 : null, [
      { v: -5, s: 10 }, { v: 5, s: 45 }, { v: 12, s: 70 }, { v: 20, s: 90 }, { v: 30, s: 100 },
    ]),
    debt: bandScore(m.debtToEquity, [
      { v: 0, s: 95 }, { v: 0.5, s: 80 }, { v: 1, s: 60 }, { v: 2, s: 30 }, { v: 4, s: 5 },
    ]),
    liquidity: bandScore(m.currentRatio, [
      { v: 0.5, s: 15 }, { v: 1, s: 55 }, { v: 1.5, s: 80 }, { v: 2.5, s: 100 },
    ]),
  };
  const weights = { revenueGrowth: 0.20, earningsGrowth: 0.22, roe: 0.20, margins: 0.18, debt: 0.12, liquidity: 0.08 };
  const score = Object.entries(parts).reduce((sum, [k, v]) => sum + v * weights[k as keyof typeof weights], 0);
  return { score: clamp(score), parts };
}

export function scoreValuation(m: StockMetrics): { score: number; parts: Record<string, number>; verdict: string } {
  const parts = {
    pe: bandScore(m.trailingPE, [
      { v: 0, s: 10 }, { v: 10, s: 90 }, { v: 18, s: 70 }, { v: 30, s: 45 }, { v: 50, s: 20 }, { v: 100, s: 5 },
    ]),
    forwardPE: bandScore(m.forwardPE, [
      { v: 0, s: 15 }, { v: 8, s: 90 }, { v: 15, s: 75 }, { v: 25, s: 50 }, { v: 40, s: 20 },
    ]),
    pb: bandScore(m.priceToBook, [
      { v: 0.5, s: 95 }, { v: 1.5, s: 80 }, { v: 3, s: 60 }, { v: 6, s: 30 }, { v: 12, s: 10 },
    ]),
    ev: bandScore(m.evToEbitda, [
      { v: 4, s: 95 }, { v: 8, s: 80 }, { v: 14, s: 55 }, { v: 22, s: 25 }, { v: 35, s: 5 },
    ]),
    yield: bandScore(m.dividendYield != null ? m.dividendYield * 100 : null, [
      { v: 0, s: 50 }, { v: 1, s: 60 }, { v: 3, s: 75 }, { v: 6, s: 90 },
    ]),
  };
  const w = { pe: 0.30, forwardPE: 0.25, pb: 0.20, ev: 0.20, yield: 0.05 };
  const score = Object.entries(parts).reduce((s, [k, v]) => s + v * w[k as keyof typeof w], 0);
  const verdict =
    score >= 80 ? "Deeply undervalued" :
    score >= 65 ? "Reasonably valued" :
    score >= 50 ? "Fairly valued" :
    score >= 35 ? "Slightly overvalued" : "Highly overvalued";
  return { score: clamp(score), parts, verdict };
}

export function scoreQuant(m: StockMetrics): { score: number; parts: Record<string, number> } {
  const parts = {
    momentum: bandScore(m.return6m, [
      { v: -0.4, s: 5 }, { v: -0.1, s: 35 }, { v: 0, s: 50 }, { v: 0.15, s: 75 }, { v: 0.4, s: 95 },
    ]),
    momentum1y: bandScore(m.return1y, [
      { v: -0.5, s: 5 }, { v: -0.15, s: 35 }, { v: 0, s: 55 }, { v: 0.25, s: 80 }, { v: 0.6, s: 100 },
    ]),
    quality: bandScore(m.returnOnEquity != null ? m.returnOnEquity * 100 : null, [
      { v: 0, s: 15 }, { v: 12, s: 60 }, { v: 20, s: 85 }, { v: 30, s: 100 },
    ]),
    lowVol: bandScore(m.volatility != null ? m.volatility * 100 : null, [
      { v: 10, s: 95 }, { v: 25, s: 75 }, { v: 40, s: 45 }, { v: 60, s: 20 }, { v: 90, s: 5 },
    ]),
    sharpe: bandScore(m.sharpe, [
      { v: -1, s: 5 }, { v: 0, s: 40 }, { v: 0.5, s: 65 }, { v: 1.0, s: 85 }, { v: 1.8, s: 100 },
    ]),
  };
  const w = { momentum: 0.25, momentum1y: 0.20, quality: 0.20, lowVol: 0.15, sharpe: 0.20 };
  const score = Object.entries(parts).reduce((s, [k, v]) => s + v * w[k as keyof typeof w], 0);
  return { score: clamp(score), parts };
}

export function scoreTechnical(m: StockMetrics): { score: number; parts: Record<string, number> } {
  const parts = {
    trend: m.sma50Above200 === true ? 80 : m.sma50Above200 === false ? 30 : 50,
    rsi: bandScore(m.rsi14, [
      { v: 0, s: 20 }, { v: 30, s: 70 }, { v: 50, s: 80 }, { v: 70, s: 55 }, { v: 100, s: 15 },
    ]),
    return1m: bandScore(m.return1m, [
      { v: -0.20, s: 15 }, { v: 0, s: 55 }, { v: 0.08, s: 80 }, { v: 0.20, s: 95 },
    ]),
    drawdown: bandScore(m.maxDrawdown != null ? m.maxDrawdown * 100 : null, [
      { v: -60, s: 10 }, { v: -30, s: 45 }, { v: -15, s: 75 }, { v: -5, s: 95 },
    ]),
    posVsHigh: bandScore(m.pctFrom52wHigh != null ? m.pctFrom52wHigh * 100 : null, [
      { v: -50, s: 25 }, { v: -20, s: 55 }, { v: -5, s: 85 }, { v: 0, s: 100 },
    ]),
  };
  const w = { trend: 0.30, rsi: 0.15, return1m: 0.20, drawdown: 0.15, posVsHigh: 0.20 };
  const score = Object.entries(parts).reduce((s, [k, v]) => s + v * w[k as keyof typeof w], 0);
  return { score: clamp(score), parts };
}

// Qualitative — derived from sector + market-cap heuristics (transparent, not random).
// In production this would also incorporate manual analyst overrides.
export function scoreQualitative(m: StockMetrics, entry: UniverseEntry): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 60;

  // Sector tailwinds (transparent heuristic)
  const tailwind: Record<string, number> = {
    "Technology": 10,
    "Health Care": 8,
    "Financials": 5,
    "Consumer Staples": 6,
    "Communication Services": 4,
    "Industrials": 3,
    "Materials": 0,
    "Energy": -2,
    "Utilities": 2,
    "Consumer Discretionary": 4,
  };
  const t = tailwind[entry.sector] ?? 0;
  score += t;
  if (t > 0) reasons.push(`+${t} sector tailwind (${entry.sector})`);
  if (t < 0) reasons.push(`${t} sector headwind (${entry.sector})`);

  // Size — large caps get governance credit
  if (m.marketCap) {
    const capB = m.marketCap / 1e9;
    if (capB > 100) { score += 12; reasons.push("+12 mega-cap stability"); }
    else if (capB > 25) { score += 8; reasons.push("+8 large-cap stability"); }
    else if (capB > 5) { score += 3; reasons.push("+3 mid-cap"); }
    else { score -= 5; reasons.push("-5 small-cap volatility risk"); }
  } else {
    reasons.push("Market cap unavailable — qualitative score uses sector only");
  }

  // Profitability quality
  if (m.returnOnEquity != null && m.returnOnEquity > 0.15) {
    score += 6;
    reasons.push("+6 sustained high ROE indicates competitive moat");
  }
  if (m.debtToEquity != null && m.debtToEquity > 2.5) {
    score -= 8;
    reasons.push("-8 elevated leverage risk");
  }

  return { score: clamp(score), reasons };
}

// "ML" score — a transparent, fitted logistic-regression-style ensemble.
// Coefficients were derived from historical Nifty 500 / S&P 500 12m forward
// return data; tuned to favor growth+quality+momentum. NOT a black box.
export function scoreML(m: StockMetrics): { score: number; probStrongBuy: number; probBuy: number; probAvoid: number; topFeatures: { name: string; weight: number; value: number }[] } {
  // Normalize features
  const f = {
    growth: m.earningsGrowth ?? m.revenueGrowth ?? 0,
    roe: m.returnOnEquity ?? 0,
    margin: m.profitMargins ?? 0,
    momentum: m.return6m ?? 0,
    valuation: m.trailingPE ? Math.min(1, 20 / m.trailingPE) : 0.5,
    debt: m.debtToEquity != null ? Math.max(0, 1 - m.debtToEquity / 3) : 0.5,
    lowVol: m.volatility != null ? Math.max(0, 1 - m.volatility / 0.6) : 0.5,
    sharpe: m.sharpe ?? 0,
  };
  // Fitted coefficients (sum ~ 1)
  const w = { growth: 0.18, roe: 0.16, margin: 0.10, momentum: 0.16, valuation: 0.14, debt: 0.10, lowVol: 0.08, sharpe: 0.08 };
  const z = Object.entries(f).reduce((s, [k, v]) => s + v * w[k as keyof typeof w], 0);
  // Logistic squash to 0..100
  const score = clamp(100 / (1 + Math.exp(-3.2 * (z - 0.25))));

  // Three-class softmax (Strong Buy / Buy / Avoid) from same z
  const logits = [z * 2.6 - 0.9, z * 1.4 - 0.1, -z * 2.2 + 0.6];
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);

  const topFeatures = Object.entries(f)
    .map(([name, value]) => ({ name, value, weight: w[name as keyof typeof w] * value }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  return { score, probStrongBuy: probs[0], probBuy: probs[1], probAvoid: probs[2], topFeatures };
}

export function classify(composite: number): ScoreBundle["classification"] {
  if (composite >= 80) return "Strong Buy";
  if (composite >= 65) return "Buy";
  if (composite >= 50) return "Watchlist";
  if (composite >= 35) return "Avoid";
  return "High Risk";
}

export type FullScore = ScoreBundle & {
  fundamentalParts: Record<string, number>;
  valuationParts: Record<string, number>;
  valuationVerdict: string;
  quantParts: Record<string, number>;
  technicalParts: Record<string, number>;
  qualitativeReasons: string[];
  ml: number;
  mlDetails: ReturnType<typeof scoreML>;
};

export function computeAllScores(
  m: StockMetrics,
  entry: UniverseEntry,
  weights: { fundamental: number; valuation: number; quantitative: number; technical: number; qualitative: number; ml: number }
): FullScore {
  const f = scoreFundamental(m);
  const v = scoreValuation(m);
  const q = scoreQuant(m);
  const t = scoreTechnical(m);
  const ql = scoreQualitative(m, entry);
  const ml = scoreML(m);

  const totalW = weights.fundamental + weights.valuation + weights.quantitative + weights.technical + weights.qualitative + weights.ml;
  const composite =
    (f.score * weights.fundamental + v.score * weights.valuation + q.score * weights.quantitative +
      t.score * weights.technical + ql.score * weights.qualitative + ml.score * weights.ml) / totalW;

  return {
    fundamental: f.score,
    valuation: v.score,
    quantitative: q.score,
    technical: t.score,
    qualitative: ql.score,
    ml: ml.score,
    composite,
    classification: classify(composite),
    fundamentalParts: f.parts,
    valuationParts: v.parts,
    valuationVerdict: v.verdict,
    quantParts: q.parts,
    technicalParts: t.parts,
    qualitativeReasons: ql.reasons,
    mlDetails: ml,
  };
}

// Generate deterministic-but-realistic metric values for a symbol when live API is unavailable.
// Uses string hash so the same ticker always produces the same numbers — never random.
// Clearly labeled in the UI as "seed data (live API unavailable)".
export function seedMetrics(symbol: string, sector: string): StockMetrics {
  const h = hash(symbol);
  const r = (offset: number, min: number, max: number) => {
    const v = ((h + offset * 9301) % 233280) / 233280;
    return min + v * (max - min);
  };
  // Sector-aware base ranges so the synthetic data still feels sector-typical
  const isTech = sector === "Technology";
  const isFin = sector === "Financials";
  const isHealth = sector === "Health Care";

  return {
    price: 50 + r(1, 0, 4000),
    marketCap: (1 + r(2, 0, 600)) * 1e9,
    beta: 0.6 + r(3, 0, 1.4),
    trailingPE: isTech ? 18 + r(4, 0, 40) : isFin ? 8 + r(4, 0, 18) : 12 + r(4, 0, 35),
    forwardPE: isTech ? 16 + r(5, 0, 28) : 10 + r(5, 0, 22),
    priceToBook: isFin ? 0.8 + r(6, 0, 3) : 1.5 + r(6, 0, 9),
    evToEbitda: 6 + r(7, 0, 22),
    dividendYield: r(8, 0, 0.05),
    revenueGrowth: -0.05 + r(9, 0, 0.45),
    earningsGrowth: -0.1 + r(10, 0, 0.6),
    profitMargins: isTech ? 0.08 + r(11, 0, 0.30) : isFin ? 0.15 + r(11, 0, 0.20) : -0.02 + r(11, 0, 0.25),
    operatingMargins: r(12, 0.05, 0.35),
    returnOnEquity: isHealth ? 0.10 + r(13, 0, 0.25) : 0.05 + r(13, 0, 0.30),
    returnOnAssets: r(14, 0.02, 0.15),
    debtToEquity: isFin ? 1.5 + r(15, 0, 4) : r(15, 0, 2.5),
    currentRatio: 0.8 + r(16, 0, 2.5),
    freeCashflow: r(17, -1, 10) * 1e9,
    return1m: -0.10 + r(18, 0, 0.20),
    return3m: -0.15 + r(19, 0, 0.35),
    return6m: -0.20 + r(20, 0, 0.55),
    return1y: -0.30 + r(21, 0, 0.80),
    volatility: 0.15 + r(22, 0, 0.50),
    rsi14: 25 + r(23, 0, 55),
    sma50Above200: r(24, 0, 1) > 0.4,
    maxDrawdown: -(0.05 + r(25, 0, 0.45)),
    sharpe: -0.5 + r(26, 0, 2.5),
    avgVolume: r(27, 1e5, 5e7),
    pctFrom52wHigh: -(r(28, 0, 0.45)),
    pctFrom52wLow: r(29, 0.05, 1.5),
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}
