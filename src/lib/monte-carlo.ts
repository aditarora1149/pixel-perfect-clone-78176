// Geometric Brownian Motion Monte Carlo, pure & client-safe
export type SimResult = {
  paths: number[][];   // [path][step]
  finals: number[];
  mean: number;
  median: number;
  p5: number;
  p95: number;
  var95: number;       // Value at Risk (loss, positive number)
  cvar95: number;
  probProfit: number;
};

export function runMonteCarlo(opts: {
  startPrice: number;
  mu: number;       // annualized expected return
  sigma: number;    // annualized volatility
  days: number;     // horizon in trading days
  paths: number;
  seed?: number;
}): SimResult {
  const { startPrice, mu, sigma, days, paths } = opts;
  const dt = 1 / 252;
  let seed = opts.seed ?? 12345;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
  const gauss = () => {
    const u1 = Math.max(1e-9, rand());
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const out: number[][] = [];
  const finals: number[] = [];
  // For very large path counts, sample for storage but compute stats from all
  const storeStep = Math.max(1, Math.floor(paths / 200));

  for (let p = 0; p < paths; p++) {
    const row: number[] = [];
    let price = startPrice;
    if (p % storeStep === 0) row.push(price);
    for (let i = 0; i < days; i++) {
      const z = gauss();
      price = price * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z);
      if (p % storeStep === 0 && (i % Math.max(1, Math.floor(days / 60)) === 0 || i === days - 1)) {
        row.push(price);
      }
    }
    finals.push(price);
    if (p % storeStep === 0) out.push(row);
  }

  const sorted = [...finals].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const mean = finals.reduce((s, v) => s + v, 0) / finals.length;
  const var95 = Math.max(0, startPrice - q(0.05));
  const tail = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)));
  const cvar95 = Math.max(0, startPrice - tail.reduce((s, v) => s + v, 0) / tail.length);
  return {
    paths: out,
    finals,
    mean,
    median: q(0.5),
    p5: q(0.05),
    p95: q(0.95),
    var95,
    cvar95,
    probProfit: finals.filter((v) => v > startPrice).length / finals.length,
  };
}
