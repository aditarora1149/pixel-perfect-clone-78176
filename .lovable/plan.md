
# Institutional Stock Market Analysis Tool — Build Plan

A serious, research-backed tool inspired by your PDF blueprint. The guiding rule everywhere: **accurate reasoning > flashy claims**. Every score is computed from real or clearly-labeled data, every assumption is shown, and "data unavailable" is a first-class state — never a hallucination.

## What you'll get

A modern fintech dashboard (Aladdin-inspired dark theme) covering all 22 pages from the blueprint, with a **Market Toggle (India NSE/BSE ↔ US NYSE/NASDAQ)** in the top bar, plus four flagship interactive experiences.

### Flagship interactive features
1. **Interactive Monte Carlo Simulator** — sliders for horizon, volatility (σ), drift (μ), starting price, number of paths (100–5000). Animated fan chart of simulated price paths, distribution histogram, VaR/CVaR at 95% & 99%, probability of profit, and best/worst-case bands. Runs entirely client-side using geometric Brownian motion seeded from the stock's historical returns.
2. **3D Risk / Sector Visualization** — Three.js scene plotting the universe in 3D space (X = valuation z-score, Y = momentum, Z = quality), colored by sector, sized by market cap. Orbit/zoom, click a node to open the stock detail page. Toggle to a "risk-return surface" view (efficient frontier in 3D).
3. **AI Analyst Chat** — chat with an "institutional analyst" persona about any stock or the whole Top 20. Uses Lovable AI (Gemini 3 Flash) on the server, grounded with the actual computed scores/metrics for the stock so it cannot hallucinate numbers. Streamed responses via AI SDK + AI Elements.
4. **Sandbox: Tune Your Own Weights** — drag sliders for the 6 module weights (Fundamental / Valuation / Quant / Technical / Qualitative / ML). The Top 20 re-ranks live with animated row transitions. "Reset to institutional defaults" button.

## Page map (22 pages)

| # | Route | Purpose |
|---|---|---|
| 1 | `/` | Executive dashboard: market regime, Top 20 preview, sector heatmap, today's signals |
| 2 | `/screener` | Stage 1 funnel: full universe → Top 100, with filter controls |
| 3 | `/top-50` | Stage 2: deeper scores on 100 → 50 |
| 4 | `/top-20` | Final ranked table with entry/SL/target/upside/horizon |
| 5 | `/stock/$symbol` | Stock detail (tabs: Fundamental, Valuation, Quant, Technical, Qualitative, News, ML, Risk) |
| 6 | `/fundamentals` | Cross-stock fundamental comparison |
| 7 | `/valuation` | Valuation matrix + DCF/PE/EV-EBITDA breakdowns |
| 8 | `/quant` | Factor scores (momentum, quality, low-vol, value, size) |
| 9 | `/technical` | Technical scans, breakout zones, RS vs index |
| 10 | `/qualitative` | Moat, governance, management quality scorecards |
| 11 | `/ml/xgboost` | XGBoost-style feature importance & predictions |
| 12 | `/ml/random-forest` | Random Forest classification: Strong Buy → Avoid |
| 13 | `/ml/decision-tree` | Visual decision tree explainability |
| 14 | `/simulation/monte-carlo` | **Flagship interactive simulator** |
| 15 | `/risk` | Risk dashboard: VaR, drawdown, stress tests, scenarios |
| 16 | `/news` | News & sentiment dashboard with classification |
| 17 | `/portfolio` | Allocation engine: position sizing, sector caps |
| 18 | `/strategy/10k` | ₹10,000/week deployment plan |
| 19 | `/strategy/50k` | ₹50,000/week deployment plan |
| 20 | `/watchlist` | User watchlist (saved) |
| 21 | `/rejected` | Rejected stocks with reasons (transparency) |
| 22 | `/alerts` | Alerts feed: entry/stop/news/macro |
| + | `/sandbox` | Weight-tuning sandbox |
| + | `/risk-3d` | 3D universe visualization |
| + | `/analyst` | AI analyst chat |

## Data & accuracy strategy (the core promise)

Since the PDF explicitly forbids hallucinated data, here's exactly how each number is sourced:

- **Live free data** via a server function (`createServerFn`) that calls **Yahoo Finance** (`yahoo-finance2` npm pkg — works for both US and `.NS`/`.BO` Indian tickers). Pulls: quote, historical OHLCV, summary, financials, key statistics, recommendation trends.
- **Computed in TypeScript on the server** (no Python runtime): returns/volatility, momentum, RSI, MACD, SMA crossovers, Sharpe, max drawdown, beta vs index, factor z-scores, valuation ratios, growth CAGRs.
- **ML "engine"** — since we can't run XGBoost in a Worker, we build a transparent **logistic-regression + tree-ensemble scoring model in TypeScript**, fitted offline on historical Nifty 500 / S&P 500 data and shipped as model weights. The "XGBoost / Random Forest / Decision Tree" pages explain the actual model used and its feature importances honestly — no fake claims.
- **Macro data** from FRED public CSVs (US 10Y, CPI, USD/INR) cached daily.
- **Sentiment** — Google News RSS scraped server-side per ticker, classified with Lovable AI (Gemini Flash, batched, cached 6h). Each item labeled with source + timestamp.
- **Universe** — curated seed lists: Nifty 500 + BSE 500 for India, S&P 500 + Nasdaq 100 for US. Shipped as JSON so first paint is instant; live data lazy-loaded.
- **Every metric panel** shows: source, last-updated timestamp, and a "data unavailable / requires manual verification" state when the API returns null.

## Visual design

- **Modern fintech (Aladdin-inspired)** dark theme
- Tokens in `src/styles.css`: deep navy `#0a0f1c` background, electric blue `#3b82f6` primary, teal `#14b8a6` accent, amber `#f59e0b` warning, green/red for gains/losses
- Inter for UI, JetBrains Mono for numbers/tickers
- Recharts for 2D charts, Three.js + R3F for 3D, Framer Motion for transitions
- Glass-morphism cards, subtle grid backgrounds, sparklines everywhere, animated number counters

## Build phases

Because this is huge, I'll build in **3 sequential phases** in this single implementation pass (no waiting between phases). If a phase needs to be cut for size, I'll cut the lowest-value pages (20–22) first, never the flagship 4.

**Phase A — Foundation & live data**
- Enable Lovable Cloud (for AI chat + saved watchlist later)
- Install `yahoo-finance2`, `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `recharts`, AI SDK + AI Elements
- Design tokens, layout shell with top bar (logo, market toggle, search, theme), left nav
- Server functions: `getQuote`, `getHistory`, `getFundamentals`, `getUniverse`, `runScreener`
- Scoring engine module (`src/lib/scoring/`): fundamental/valuation/quant/technical/qualitative/ML scores + composite

**Phase B — Core pages**
- Dashboard, Screener, Top 100/50/20, Stock Detail (with all 8 tabs), Risk, News, Portfolio, 10k/50k strategies, Sandbox

**Phase C — Flagship interactivity + remaining pages**
- Monte Carlo simulator, 3D Risk viz, AI Analyst chat (streamed), ML pages, Watchlist, Rejected, Alerts

## Technical details

```text
src/
├── routes/                    # 22 page routes + flagship routes
├── components/
│   ├── layout/                # TopBar (with MarketToggle), SideNav
│   ├── charts/                # Sparkline, FanChart, Heatmap, FactorRadar
│   ├── three/                 # RiskUniverse3D, EfficientFrontier3D
│   ├── monte-carlo/           # SimulatorControls, PathsChart, DistributionChart
│   └── stock/                 # ScoreCard, MetricGrid, NewsList, TechnicalChart
├── lib/
│   ├── data.functions.ts      # yahoo-finance2 server functions
│   ├── data.server.ts         # Caching + parsing helpers
│   ├── scoring/               # 6 scoring modules + composite engine
│   ├── ml/                    # Pre-trained model weights + inference
│   ├── monte-carlo.ts         # GBM simulation (client-safe, pure)
│   ├── analyst.functions.ts   # AI chat server function (Lovable AI)
│   └── universe/              # Seed JSON for NSE500, BSE500, SP500, NDX100
└── stores/                    # Zustand: market toggle, watchlist, weights
```

Key libs to add: `yahoo-finance2`, `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `recharts`, `zustand`, `ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/react`, `zod`.

Lovable Cloud for: AI Gateway (analyst chat) + persistent watchlist/alerts (auth optional, anonymous device-id mode by default).

## Honest scope notes

- **"100x smarter than retail screener" framing**: I'll build a disciplined, transparent, risk-controlled tool. No "guaranteed returns" or "beats quantum computers" copy — the PDF itself forbids that, and the UI will say so.
- **Indian fundamentals on yfinance are partial.** Where data is missing, the panel will show "Requires manual verification" with a link to the Screener.in/NSE page — exactly as the PDF mandates.
- **No paid APIs.** Everything stays on free tiers.
- **First load** will use the cached universe JSON; live refresh per-stock on demand to stay within free-tier rate limits.

Ready to build when you approve.
