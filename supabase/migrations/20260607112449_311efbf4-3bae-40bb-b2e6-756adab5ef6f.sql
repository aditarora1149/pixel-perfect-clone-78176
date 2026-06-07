CREATE TABLE public.stock_metrics_cache (
  symbol TEXT PRIMARY KEY,
  market TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stock_metrics_cache TO anon, authenticated;
GRANT ALL ON public.stock_metrics_cache TO service_role;

ALTER TABLE public.stock_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read of cached metrics"
ON public.stock_metrics_cache FOR SELECT
USING (true);

CREATE INDEX idx_stock_metrics_cache_fetched ON public.stock_metrics_cache(fetched_at DESC);