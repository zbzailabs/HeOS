PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS heos_telemetry_latest (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  metric_code TEXT NOT NULL CHECK (
    metric_code IN (
      'air_temperature',
      'air_humidity',
      'soil_temperature',
      'soil_moisture',
      'illuminance',
      'co2',
      'soil_ec',
      'soil_ph',
      'battery_voltage',
      'signal_strength'
    )
  ),
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'good' CHECK (
    quality IN ('good', 'stale', 'suspect', 'unknown')
  ),
  source TEXT NOT NULL,
  source_sample_id TEXT,
  raw_payload_hash TEXT,
  observed_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, site_id, device_id, metric_code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_telemetry_history (
  id TEXT PRIMARY KEY,
  sample_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  metric_code TEXT NOT NULL CHECK (
    metric_code IN (
      'air_temperature',
      'air_humidity',
      'soil_temperature',
      'soil_moisture',
      'illuminance',
      'co2',
      'soil_ec',
      'soil_ph',
      'battery_voltage',
      'signal_strength'
    )
  ),
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'good' CHECK (
    quality IN ('good', 'stale', 'suspect', 'unknown')
  ),
  source TEXT NOT NULL,
  source_sample_id TEXT,
  raw_payload_hash TEXT,
  observed_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_telemetry_latest_tenant_device
  ON heos_telemetry_latest (tenant_id, site_id, device_id);

CREATE INDEX IF NOT EXISTS idx_heos_telemetry_latest_metric_observed
  ON heos_telemetry_latest (metric_code, observed_at);

CREATE INDEX IF NOT EXISTS idx_heos_telemetry_history_device_metric_time
  ON heos_telemetry_history (
    tenant_id,
    site_id,
    device_id,
    metric_code,
    observed_at,
    id
  );

CREATE INDEX IF NOT EXISTS idx_heos_telemetry_history_tenant_time
  ON heos_telemetry_history (tenant_id, observed_at);

CREATE INDEX IF NOT EXISTS idx_heos_telemetry_history_quality
  ON heos_telemetry_history (quality);
