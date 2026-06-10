PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS heos_standard_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (
    rule_type IN (
      'offline',
      'threshold',
      'provider_error',
      'control_failed',
      'data_quality'
    )
  ),
  metric_code TEXT,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  threshold REAL,
  lower_bound REAL,
  upper_bound REAL,
  offline_after_seconds INTEGER,
  action TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'disabled', 'deprecated')),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, rule_code, version),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_alerts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  rule_id TEXT,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN (
      'offline',
      'threshold',
      'provider_error',
      'control_failed',
      'data_quality'
    )
  ),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  metric_code TEXT,
  threshold REAL,
  value_observed REAL,
  reason TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
  created_by TEXT NOT NULL CHECK (created_by IN ('system-rule', 'provider-sync', 'manual')),
  triggered_at TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (rule_id) REFERENCES heos_standard_rules(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_standard_rules_tenant_type_status
  ON heos_standard_rules (tenant_id, rule_type, status);

CREATE INDEX IF NOT EXISTS idx_heos_standard_rules_effective_window
  ON heos_standard_rules (tenant_id, effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_heos_alerts_current_key
  ON heos_alerts (
    tenant_id,
    site_id,
    device_id,
    alert_type,
    metric_code,
    rule_id,
    status
  );

CREATE INDEX IF NOT EXISTS idx_heos_alerts_tenant_status_triggered
  ON heos_alerts (tenant_id, status, triggered_at);

CREATE INDEX IF NOT EXISTS idx_heos_alerts_device_triggered
  ON heos_alerts (tenant_id, site_id, device_id, triggered_at);
