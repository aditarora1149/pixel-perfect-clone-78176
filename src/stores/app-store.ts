import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Market } from "@/lib/universe";

export type ScoringWeights = {
  fundamental: number;
  valuation: number;
  quantitative: number;
  technical: number;
  qualitative: number;
  ml: number;
};

export type Horizon = "intraday" | "short" | "weekly" | "monthly" | "medium" | "long";

export const HORIZONS: { id: Horizon; label: string; desc: string }[] = [
  { id: "intraday", label: "Intraday", desc: "Same day. Technicals, volume, news dominate." },
  { id: "short", label: "Short-term (1–5d)", desc: "Swing trade. Technicals + momentum." },
  { id: "weekly", label: "Weekly (1–4w)", desc: "Tech + quant + sentiment + risk." },
  { id: "monthly", label: "Monthly (1–6m)", desc: "Balanced tech + fundamentals." },
  { id: "medium", label: "Medium (3–12m)", desc: "Fundamentals + valuation + ML." },
  { id: "long", label: "Long-term (1–5y+)", desc: "Fundamentals + valuation + macro + qualitative." },
];

export const DEFAULT_WEIGHTS: ScoringWeights = {
  fundamental: 25, valuation: 20, quantitative: 12, technical: 10, qualitative: 13, ml: 20,
};

// Horizon-aware weighting overrides. Returns weights that reflect what matters per horizon.
export function weightsForHorizon(h: Horizon, base = DEFAULT_WEIGHTS): ScoringWeights {
  switch (h) {
    case "intraday": return { fundamental: 2, valuation: 2, quantitative: 18, technical: 55, qualitative: 3, ml: 20 };
    case "short":    return { fundamental: 5, valuation: 5, quantitative: 25, technical: 40, qualitative: 5, ml: 20 };
    case "weekly":   return { fundamental: 10, valuation: 10, quantitative: 25, technical: 25, qualitative: 10, ml: 20 };
    case "monthly":  return { fundamental: 18, valuation: 15, quantitative: 20, technical: 15, qualitative: 12, ml: 20 };
    case "medium":   return { fundamental: 22, valuation: 20, quantitative: 15, technical: 8, qualitative: 15, ml: 20 };
    case "long":     return base;
  }
}

export type Alert = { id: string; symbol: string; type: "price-above" | "price-below" | "score-above"; value: number; createdAt: number };

type AppState = {
  market: Market;
  setMarket: (m: Market) => void;

  horizon: Horizon;
  setHorizon: (h: Horizon) => void;

  weights: ScoringWeights;
  setWeights: (w: Partial<ScoringWeights>) => void;
  resetWeights: () => void;

  watchlist: string[];
  toggleWatch: (symbol: string) => void;

  rejected: string[];
  reject: (symbol: string, reason?: string) => void;
  unreject: (symbol: string) => void;
  rejectReasons: Record<string, string>;

  alerts: Alert[];
  addAlert: (a: Omit<Alert, "id" | "createdAt">) => void;
  removeAlert: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      market: "IN",
      setMarket: (m) => set({ market: m }),

      horizon: "medium",
      setHorizon: (h) => set({ horizon: h }),

      weights: DEFAULT_WEIGHTS,
      setWeights: (w) => set({ weights: { ...get().weights, ...w } }),
      resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),

      watchlist: [],
      toggleWatch: (s) =>
        set((st) => ({
          watchlist: st.watchlist.includes(s) ? st.watchlist.filter((x) => x !== s) : [...st.watchlist, s],
        })),

      rejected: [],
      rejectReasons: {},
      reject: (s, reason) =>
        set((st) => ({
          rejected: st.rejected.includes(s) ? st.rejected : [...st.rejected, s],
          rejectReasons: { ...st.rejectReasons, [s]: reason ?? "Manual reject" },
        })),
      unreject: (s) =>
        set((st) => {
          const { [s]: _drop, ...rest } = st.rejectReasons;
          return { rejected: st.rejected.filter((x) => x !== s), rejectReasons: rest };
        }),

      alerts: [],
      addAlert: (a) =>
        set((st) => ({
          alerts: [...st.alerts, { ...a, id: Math.random().toString(36).slice(2, 10), createdAt: Date.now() }],
        })),
      removeAlert: (id) => set((st) => ({ alerts: st.alerts.filter((a) => a.id !== id) })),
    }),
    { name: "institutional-stock-app" },
  ),
);
