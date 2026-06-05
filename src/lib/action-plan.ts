// Translates scores + metrics into a horizon-specific action plan:
// entry zone, stop-loss, targets, expected upside/downside, confidence.
// Fully deterministic — no randomness, no hidden assumptions.

import type { StockMetrics } from "./scoring";
import type { FullScore } from "./scoring";
import type { Horizon } from "@/stores/app-store";

export type ActionPlan = {
  horizon: Horizon;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  upsidePct: [number, number];
  downsidePct: [number, number];
  timeframe: string;
  suitability: "Excellent" | "Good" | "Fair" | "Poor";
  confidence: "High" | "Medium" | "Low";
  notes: string[];
};

const HORIZON_PARAMS: Record<Horizon, { stopMultiplier: number; t1Mult: number; t2Mult: number; timeframe: string }> = {
  intraday: { stopMultiplier: 0.25, t1Mult: 0.5, t2Mult: 1.0, timeframe: "Same day" },
  short:    { stopMultiplier: 0.35, t1Mult: 0.7, t2Mult: 1.4, timeframe: "1–5 trading days" },
  weekly:   { stopMultiplier: 0.5,  t1Mult: 0.9, t2Mult: 1.8, timeframe: "1–4 weeks" },
  monthly:  { stopMultiplier: 0.7,  t1Mult: 1.2, t2Mult: 2.2, timeframe: "1–6 months" },
  medium:   { stopMultiplier: 1.0,  t1Mult: 1.5, t2Mult: 2.5, timeframe: "3–12 months" },
  long:     { stopMultiplier: 1.3,  t1Mult: 2.0, t2Mult: 3.5, timeframe: "1–5 years" },
};

export function computeActionPlan(m: StockMetrics, s: FullScore, horizon: Horizon): ActionPlan {
  const price = m.price ?? 100;
  const vol = Math.max(0.1, Math.min(0.9, m.volatility ?? 0.3));
  const p = HORIZON_PARAMS[horizon];

  // Entry zone: a 3% band around current price, tightened for shorter horizons
  const bandPct = horizon === "intraday" ? 0.005 : horizon === "short" ? 0.01 : horizon === "weekly" ? 0.02 : 0.04;
  const entryLow = price * (1 - bandPct);
  const entryHigh = price * (1 + bandPct);

  // Stop-loss: vol-aware, scaled by horizon
  const stopPct = vol * p.stopMultiplier * 0.5;
  const stopLoss = price * (1 - Math.max(0.02, Math.min(0.20, stopPct)));

  // Targets: composite-aware; high-score stocks get higher targets
  const compositeBoost = (s.composite - 50) / 100; // -0.5..+0.5
  const t1Pct = Math.max(0.02, vol * p.t1Mult * (0.4 + compositeBoost * 0.6));
  const t2Pct = Math.max(0.04, vol * p.t2Mult * (0.5 + compositeBoost * 0.7));
  const target1 = price * (1 + t1Pct);
  const target2 = price * (1 + t2Pct);

  // Expected range (Monte-Carlo-style band): driven by vol, horizon, and ML confidence
  const horizonScale = horizon === "intraday" ? 0.05 : horizon === "short" ? 0.15 : horizon === "weekly" ? 0.3 : horizon === "monthly" ? 0.6 : horizon === "medium" ? 1.0 : 1.6;
  const expectedUp: [number, number] = [
    Math.round(vol * horizonScale * 30 * (0.5 + s.mlDetails.probStrongBuy)),
    Math.round(vol * horizonScale * 60 * (0.6 + s.mlDetails.probStrongBuy)),
  ];
  const expectedDown: [number, number] = [
    -Math.round(vol * horizonScale * 20 * (0.5 + s.mlDetails.probAvoid)),
    -Math.round(vol * horizonScale * 45 * (0.6 + s.mlDetails.probAvoid)),
  ];

  // Suitability per horizon — short horizons need tech & momentum; long needs fundamentals
  const shortFit = (s.technical + s.quantitative) / 2;
  const longFit = (s.fundamental + s.valuation + s.qualitative) / 3;
  const fitScore =
    horizon === "intraday" || horizon === "short" ? shortFit :
    horizon === "weekly" ? (shortFit * 0.6 + longFit * 0.4) :
    horizon === "monthly" ? (shortFit * 0.4 + longFit * 0.6) :
    longFit;

  const suitability: ActionPlan["suitability"] =
    fitScore >= 75 ? "Excellent" : fitScore >= 60 ? "Good" : fitScore >= 45 ? "Fair" : "Poor";

  const confidence: ActionPlan["confidence"] =
    s.composite >= 70 && vol < 0.4 ? "High" : s.composite >= 55 ? "Medium" : "Low";

  const notes: string[] = [];
  if (horizon === "intraday") notes.push("Watch intraday volume and news. Avoid if spread is wide.");
  if (horizon === "long") notes.push("Stagger entries over weeks/months instead of one lump-sum.");
  if (s.valuation < 40) notes.push("Valuation is rich — consider waiting for a pullback.");
  if (vol > 0.5) notes.push("High volatility — size the position smaller.");
  if (s.mlDetails.probAvoid > 0.4) notes.push("ML model leans negative — extra caution required.");

  return {
    horizon,
    entryLow, entryHigh, stopLoss, target1, target2,
    upsidePct: expectedUp,
    downsidePct: expectedDown,
    timeframe: p.timeframe,
    suitability,
    confidence,
    notes,
  };
}
