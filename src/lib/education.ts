// Plain-English definitions used in info tooltips and the /education page.
// Written for a BBA-2 student: one sentence, one example, one investor takeaway.

export type EduItem = {
  term: string;
  definition: string;
  example: string;
  takeaway: string;
};

export const EDU: Record<string, EduItem> = {
  fundamental: {
    term: "Fundamental Score",
    definition: "How healthy the business is — revenue growth, profit margins, ROE, debt and cash flow.",
    example: "A company growing revenue 20%/year with 25% ROE and low debt scores very high.",
    takeaway: "High fundamental score = strong business. Low = weak business or in trouble.",
  },
  valuation: {
    term: "Valuation Score",
    definition: "How cheap or expensive the stock is vs its earnings, book value and cash flows.",
    example: "P/E of 12 with steady growth is cheap; P/E of 80 with slow growth is expensive.",
    takeaway: "High score = cheap. Even a great business is a bad investment if price is too high.",
  },
  quant: {
    term: "Quantitative Factors",
    definition: "Numeric signals: 6-month momentum, volatility, quality (ROE), Sharpe ratio.",
    example: "A stock up 25% in 6 months with low volatility scores well on momentum + quality.",
    takeaway: "These factors historically beat the market over the long run — they capture trend.",
  },
  technical: {
    term: "Technical Score",
    definition: "Price-chart signals: trend (50d vs 200d SMA), RSI, drawdown, distance from 52-week high.",
    example: "Price above its 200-day average + RSI around 55 = healthy uptrend.",
    takeaway: "Helps with timing entries. Don't use it alone for long-term decisions.",
  },
  qualitative: {
    term: "Qualitative Score",
    definition: "Things numbers don't capture: sector tailwinds, brand, management, moat, size stability.",
    example: "A large-cap tech leader in a growing industry gets a qualitative boost.",
    takeaway: "Adjusts the picture for things only people (not formulas) can judge.",
  },
  ml: {
    term: "ML Score",
    definition: "A transparent ensemble (logistic regression + random forest) that combines all features.",
    example: "Model says 65% probability of Strong Buy, 25% Buy, 10% Avoid.",
    takeaway: "It does NOT guarantee returns. It ranks stocks and flags risky ones.",
  },
  composite: {
    term: "Composite Score",
    definition: "Weighted average of all 6 modules using the active weighting profile.",
    example: "Composite of 78 → 'Strong Buy' bucket; 42 → 'Avoid' bucket.",
    takeaway: "Top 100 → 50 → 20 funnel is a sort by composite. No hidden adjustment.",
  },
  pe: { term: "P/E ratio", definition: "Price / earnings per share. How much you pay per ₹1 of earnings.", example: "Stock ₹500, EPS ₹25 → P/E = 20×.", takeaway: "Lower P/E ≈ cheaper, but compare within the same sector." },
  pb: { term: "P/B ratio", definition: "Price / book value per share. How much you pay per ₹1 of net assets.", example: "Price ₹200, Book ₹100 → P/B = 2×.", takeaway: "Useful for banks, asset-heavy firms. <1× = below liquidation value." },
  evEbitda: { term: "EV/EBITDA", definition: "Enterprise value / operating cash earnings — works across debt structures.", example: "EV/EBITDA of 8× is fair; 25× is rich.", takeaway: "Better than P/E for capital-intensive firms." },
  roe: { term: "Return on Equity (ROE)", definition: "Net profit divided by shareholders' equity. How well management uses your capital.", example: "ROE of 25% means ₹25 profit per ₹100 of equity each year.", takeaway: "Sustained ROE > 18% usually signals a quality business." },
  debt: { term: "Debt/Equity", definition: "Total debt divided by equity. How leveraged the firm is.", example: "D/E of 0.3 is conservative; 3.0 is high.", takeaway: "High D/E means more risk if interest rates rise or earnings dip." },
  rsi: { term: "RSI(14)", definition: "Relative Strength Index over 14 days. 0–100 oscillator.", example: ">70 = overbought, <30 = oversold, 40–60 = neutral.", takeaway: "Helps avoid chasing extremes." },
  sma: { term: "SMA 50/200", definition: "50-day vs 200-day moving averages — a classic trend filter.", example: "50d above 200d ('golden cross') = uptrend.", takeaway: "Simple, robust trend signal used by institutions." },
  sharpe: { term: "Sharpe Ratio", definition: "Return per unit of volatility. Higher = better risk-adjusted return.", example: "Sharpe of 1.5 over 5 years is excellent.", takeaway: "Compares investments fairly across different risk levels." },
  drawdown: { term: "Max Drawdown", definition: "The worst peak-to-trough fall over a period.", example: "Stock falls from ₹500 to ₹350 → 30% drawdown.", takeaway: "Tells you how bad it can get even for good stocks." },
  monteCarlo: { term: "Monte Carlo simulation", definition: "Runs thousands of random price paths to estimate a range of future outcomes.", example: "Model: 'In 1y, 90% of paths between -15% and +35%.'", takeaway: "Gives a range, not a single forecast. Real markets can still surprise." },
  varCvar: { term: "VaR / CVaR", definition: "Value-at-Risk = worst loss at a given confidence (e.g., 95%). CVaR = average of the worst cases.", example: "VaR95 = -12% → in worst 5% of cases you lose ≥12%.", takeaway: "Tells you the size of bad outcomes, not just average return." },
  beta: { term: "Beta", definition: "Sensitivity to overall market moves. 1.0 = same as market, 2.0 = twice as volatile.", example: "Beta 1.5 → if market falls 10%, expect ~15% fall.", takeaway: "Use to gauge market-driven risk." },
};

export function getEdu(key: string): EduItem | undefined {
  return EDU[key];
}
