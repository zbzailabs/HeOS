CREATE TABLE IF NOT EXISTS heos_ai_provider_metrics (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  interaction_id TEXT,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  status_code INTEGER,
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
  failure_code TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (interaction_id) REFERENCES heos_ai_interactions(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_ai_provider_metrics_tenant_created
  ON heos_ai_provider_metrics (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_heos_ai_provider_metrics_tenant_status
  ON heos_ai_provider_metrics (tenant_id, status, created_at DESC);
