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

// Institutional defaults — matches the PDF blueprint weighting
export const DEFAULT_WEIGHTS: ScoringWeights = {
  fundamental: 25,
  valuation: 20,
  quantitative: 12,
  technical: 10,
  qualitative: 13,
  ml: 20,
};

type AppState = {
  market: Market;
  setMarket: (m: Market) => void;

  weights: ScoringWeights;
  setWeights: (w: Partial<ScoringWeights>) => void;
  resetWeights: () => void;

  watchlist: string[];
  toggleWatch: (symbol: string) => void;

  rejected: string[];
  reject: (symbol: string, reason?: string) => void;
  rejectReasons: Record<string, string>;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      market: "IN",
      setMarket: (m) => set({ market: m }),

      weights: DEFAULT_WEIGHTS,
      setWeights: (w) => set({ weights: { ...get().weights, ...w } }),
      resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),

      watchlist: [],
      toggleWatch: (s) =>
        set((st) => ({
          watchlist: st.watchlist.includes(s)
            ? st.watchlist.filter((x) => x !== s)
            : [...st.watchlist, s],
        })),

      rejected: [],
      rejectReasons: {},
      reject: (s, reason) =>
        set((st) => ({
          rejected: st.rejected.includes(s) ? st.rejected : [...st.rejected, s],
          rejectReasons: { ...st.rejectReasons, [s]: reason ?? "Manual reject" },
        })),
    }),
    { name: "institutional-stock-app" }
  )
);
