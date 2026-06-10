PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS heos_standard_dictionary (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (
    category IN (
      'crop',
      'growth_stage',
      'metric',
      'unit',
      'device_capability',
      'alert_level'
    )
  ),
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  version TEXT NOT NULL,
  source TEXT NOT NULL,
  source_ref TEXT,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (category, code, version)
);

CREATE TABLE IF NOT EXISTS heos_standard_dictionary_changes (
  id TEXT PRIMARY KEY,
  dictionary_id TEXT NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  version TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (
    change_type IN ('create', 'update', 'deprecate', 'restore')
  ),
  changed_fields_json TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (dictionary_id) REFERENCES heos_standard_dictionary(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_standard_dictionary_category_code
  ON heos_standard_dictionary (category, code);

CREATE INDEX IF NOT EXISTS idx_heos_standard_dictionary_effective_window
  ON heos_standard_dictionary (category, effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_heos_standard_dictionary_status
  ON heos_standard_dictionary (status);

CREATE INDEX IF NOT EXISTS idx_heos_standard_dictionary_changes_item
  ON heos_standard_dictionary_changes (dictionary_id, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_standard_dictionary_changes_code
  ON heos_standard_dictionary_changes (category, code, version);

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
  ('std-dict-crop-tomato-v0-1', 'crop', 'tomato', '番茄', '设施种植高频果菜作物。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-crop-strawberry-v0-1', 'crop', 'strawberry', '草莓', '设施种植高频浆果作物。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-crop-cucumber-v0-1', 'crop', 'cucumber', '黄瓜', '设施种植高频瓜类作物。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30),
  ('std-dict-crop-rice-v0-1', 'crop', 'rice', '水稻', '长三角常见粮食作物。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 40),
  ('std-dict-crop-lettuce-v0-1', 'crop', 'lettuce', '生菜', '设施叶菜作物。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 50),
  ('std-dict-growth-stage-seedling-v0-1', 'growth_stage', 'seedling', '苗期', '出苗至定植前阶段。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-growth-stage-vegetative-v0-1', 'growth_stage', 'vegetative', '营养生长期', '植株营养器官快速生长阶段。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-growth-stage-flowering-v0-1', 'growth_stage', 'flowering', '开花期', '花芽分化和开花阶段。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30),
  ('std-dict-growth-stage-fruiting-v0-1', 'growth_stage', 'fruiting', '结果期', '果实膨大和成熟阶段。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 40),
  ('std-dict-growth-stage-harvest-v0-1', 'growth_stage', 'harvest', '采收期', '达到采收标准并进入采收作业阶段。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 50),
  ('std-dict-unit-celsius-v0-1', 'unit', 'celsius', '摄氏度', '温度单位，符号 C。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-unit-percent-v0-1', 'unit', 'percent', '百分比', '相对比例单位，符号 %。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-unit-lux-v0-1', 'unit', 'lux', '勒克斯', '照度单位，符号 lx。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30),
  ('std-dict-unit-ppm-v0-1', 'unit', 'ppm', '百万分比浓度', '浓度单位 ppm。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 40),
  ('std-dict-unit-us-cm-v0-1', 'unit', 'us_cm', '微西门子每厘米', '电导率单位 uS/cm。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 50),
  ('std-dict-unit-ph-v0-1', 'unit', 'ph', '酸碱度', 'pH 无量纲指标。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 60),
  ('std-dict-unit-mm-v0-1', 'unit', 'mm', '毫米', '降雨量、灌溉量等长度单位，符号 mm。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 70),
  ('std-dict-unit-volt-v0-1', 'unit', 'volt', '伏特', '电压单位，符号 V。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 80),
  ('std-dict-unit-dbm-v0-1', 'unit', 'dbm', '毫瓦分贝', '信号强度单位 dBm。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 90),
  ('std-dict-metric-air-temperature-v0-1', 'metric', 'air_temperature', '空气温度', '空气温度遥测指标。', 'celsius', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-metric-air-humidity-v0-1', 'metric', 'air_humidity', '空气湿度', '空气相对湿度遥测指标。', 'percent', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-metric-soil-temperature-v0-1', 'metric', 'soil_temperature', '土壤温度', '土壤温度遥测指标。', 'celsius', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30),
  ('std-dict-metric-soil-moisture-v0-1', 'metric', 'soil_moisture', '土壤湿度', '土壤含水率遥测指标。', 'percent', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 40),
  ('std-dict-metric-illuminance-v0-1', 'metric', 'illuminance', '照度', '环境照度遥测指标。', 'lux', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 50),
  ('std-dict-metric-rainfall-v0-1', 'metric', 'rainfall', '雨量', '降雨量遥测指标。', 'mm', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 60),
  ('std-dict-metric-co2-v0-1', 'metric', 'co2', '二氧化碳浓度', '空气二氧化碳浓度遥测指标。', 'ppm', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 70),
  ('std-dict-metric-soil-ec-v0-1', 'metric', 'soil_ec', '土壤电导率', '土壤电导率遥测指标。', 'us_cm', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 80),
  ('std-dict-metric-soil-ph-v0-1', 'metric', 'soil_ph', '土壤酸碱度', '土壤 pH 遥测指标。', 'ph', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 90),
  ('std-dict-metric-battery-voltage-v0-1', 'metric', 'battery_voltage', '电池电压', '设备电池电压遥测指标。', 'volt', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 100),
  ('std-dict-metric-signal-strength-v0-1', 'metric', 'signal_strength', '信号强度', '设备通信信号强度遥测指标。', 'dbm', 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 110),
  ('std-dict-device-capability-telemetry-v0-1', 'device_capability', 'telemetry', '遥测上报', '设备支持遥测采样上报。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-device-capability-offline-detection-v0-1', 'device_capability', 'offline_detection', '离线判定', '设备支持离线状态判定。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-device-capability-threshold-alert-v0-1', 'device_capability', 'threshold_alert', '阈值告警', '设备数据支持阈值告警。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30),
  ('std-dict-device-capability-provider-sync-v0-1', 'device_capability', 'provider_sync', '供应商同步', '设备支持供应商平台同步。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 40),
  ('std-dict-alert-level-info-v0-1', 'alert_level', 'info', '提示', '无需立即处置的信息提醒。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 10),
  ('std-dict-alert-level-warning-v0-1', 'alert_level', 'warning', '预警', '需要人工关注的风险事件。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 20),
  ('std-dict-alert-level-critical-v0-1', 'alert_level', 'critical', '严重', '需要优先处置的严重事件。', NULL, 'v0.1', 'heos-prd', 'docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01', '2026-06-10T00:00:00.000Z', NULL, 'active', 30);

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
  'S0-01 initial dictionary baseline',
  source,
  'system'
FROM heos_standard_dictionary
WHERE source = 'heos-prd'
  AND version = 'v0.1';
