// Ranking helper: produces deterministic Top-N rankings from the seed universe
// using the transparent scoring engine. No randomness, no hallucinations.

import { computeAllScores, seedMetrics, type FullScore, type StockMetrics } from "./scoring";
import { getUniverse, type Market, type UniverseEntry } from "./universe";
import type { ScoringWeights } from "@/stores/app-store";

export type RankedRow = {
  entry: UniverseEntry;
  metrics: StockMetrics;
  scores: FullScore;
  entryPrice: number;
  stopLoss: number;
  target: number;
  upsidePct: number;
  horizonWeeks: number;
};

export function rankUniverse(market: Market, weights: ScoringWeights): RankedRow[] {
  const universe = getUniverse(market);
  const rows = universe.map((entry) => {
    const m = seedMetrics(entry.symbol, entry.sector);
    const scores = computeAllScores(m, entry, weights);
    const price = m.price ?? 100;
    const stopLoss = price * (1 - Math.max(0.05, Math.min(0.15, (m.volatility ?? 0.3) * 0.4)));
    const target = price * (1 + Math.max(0.08, Math.min(0.35, (scores.composite / 100) * 0.4)));
    return {
      entry,
      metrics: m,
      scores,
      entryPrice: price,
      stopLoss,
      target,
      upsidePct: ((target - price) / price) * 100,
      horizonWeeks: scores.composite > 75 ? 12 : scores.composite > 60 ? 16 : 24,
    };
  });
  return rows.sort((a, b) => b.scores.composite - a.scores.composite);
}

export function topN(rows: RankedRow[], n: number) {
  return rows.slice(0, n);
}

export function sectorBuckets(rows: RankedRow[]) {
  const map = new Map<string, RankedRow[]>();
  for (const r of rows) {
    const arr = map.get(r.entry.sector) ?? [];
    arr.push(r);
    map.set(r.entry.sector, arr);
  }
  return [...map.entries()]
    .map(([sector, items]) => ({
      sector,
      count: items.length,
      avgScore: items.reduce((s, x) => s + x.scores.composite, 0) / items.length,
      best: items.sort((a, b) => b.scores.composite - a.scores.composite)[0],
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}
