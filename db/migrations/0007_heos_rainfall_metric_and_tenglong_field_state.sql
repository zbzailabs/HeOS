INSERT OR IGNORE INTO heos_standard_dictionary (
  id,
  category,
  code,
  label,
  description,
  unit,
  version,
  source,
  source_ref,
  effective_from,
  effective_to,
  status,
  sort_order
) VALUES
  ('std-dict-unit-mm-v0-1', 'unit', 'mm', '毫米', '降雨量、灌溉量等长度单位，符号 mm。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 70),
  ('std-dict-metric-rainfall-v0-1', 'metric', 'rainfall', '雨量', '降雨量遥测指标。', 'mm', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 60);

INSERT OR IGNORE INTO heos_standard_dictionary_changes (
  id,
  dictionary_id,
  category,
  code,
  version,
  change_type,
  changed_fields_json,
  reason,
  source,
  created_by
)
SELECT
  id || '-create',
  id,
  category,
  code,
  version,
  'create',
  json_object(
    'category',
    category,
    'code',
    code,
    'label',
    label,
    'unit',
    unit,
    'version',
    version,
    'effectiveFrom',
    effective_from,
    'effectiveTo',
    effective_to
  ),
  'S0-01 rainfall metric addition',
  source,
  'system'
FROM heos_standard_dictionary
WHERE id IN ('std-dict-unit-mm-v0-1', 'std-dict-metric-rainfall-v0-1');

ALTER TABLE heos_telemetry_latest RENAME TO heos_telemetry_latest_old;

CREATE TABLE heos_telemetry_latest (
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
      'rainfall',
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

INSERT INTO heos_telemetry_latest (
  id,
  tenant_id,
  site_id,
  device_id,
  metric_code,
  value,
  unit,
  quality,
  source,
  source_sample_id,
  raw_payload_hash,
  observed_at,
  ingested_at,
  updated_at
)
SELECT
  id,
  tenant_id,
  site_id,
  device_id,
  metric_code,
  value,
  unit,
  quality,
  source,
  source_sample_id,
  raw_payload_hash,
  observed_at,
  ingested_at,
  updated_at
FROM heos_telemetry_latest_old;

DROP TABLE heos_telemetry_latest_old;

ALTER TABLE heos_telemetry_history RENAME TO heos_telemetry_history_old;

CREATE TABLE heos_telemetry_history (
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
      'rainfall',
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

INSERT INTO heos_telemetry_history (
  id,
  sample_key,
  tenant_id,
  site_id,
  device_id,
  metric_code,
  value,
  unit,
  quality,
  source,
  source_sample_id,
  raw_payload_hash,
  observed_at,
  ingested_at,
  created_at
)
SELECT
  id,
  sample_key,
  tenant_id,
  site_id,
  device_id,
  metric_code,
  value,
  unit,
  quality,
  source,
  source_sample_id,
  raw_payload_hash,
  observed_at,
  ingested_at,
  created_at
FROM heos_telemetry_history_old;

DROP TABLE heos_telemetry_history_old;

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
