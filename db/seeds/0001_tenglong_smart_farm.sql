PRAGMA foreign_keys = ON;

INSERT INTO heos_tenants (
  id,
  code,
  name,
  status,
  updated_at
) VALUES (
  'tenant-tenglong-school',
  'tenglong-school',
  '腾龙小学智慧农场',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (id) DO UPDATE SET
  code = excluded.code,
  name = excluded.name,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_org_units (
  id,
  tenant_id,
  code,
  name,
  type,
  sort_order,
  status,
  updated_at
) VALUES (
  'org-tenglong-farm-ops',
  'tenant-tenglong-school',
  'farm-ops',
  '智慧农场运营组',
  'department',
  10,
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = excluded.name,
  type = excluded.type,
  sort_order = excluded.sort_order,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_posts (
  id,
  tenant_id,
  code,
  name,
  sort_order,
  status,
  updated_at
) VALUES (
  'post-tenglong-farm-manager',
  'tenant-tenglong-school',
  'farm-manager',
  '智慧农场负责人',
  10,
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = excluded.name,
  sort_order = excluded.sort_order,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_users (
  id,
  tenant_id,
  org_unit_id,
  post_id,
  email,
  display_name,
  status,
  updated_at
) VALUES (
  'user-tenglong-admin',
  'tenant-tenglong-school',
  'org-tenglong-farm-ops',
  'post-tenglong-farm-manager',
  'zbzailabs@gmail.com',
  '腾龙智慧农场管理员',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, email) DO UPDATE SET
  org_unit_id = excluded.org_unit_id,
  post_id = excluded.post_id,
  display_name = excluded.display_name,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_projects (
  id,
  tenant_id,
  code,
  name,
  owner_user_id,
  status,
  region,
  description,
  updated_at
) VALUES (
  'project-tenglong-smart-farm',
  'tenant-tenglong-school',
  'tlxx-smart-farm',
  '腾龙小学智慧农场',
  'user-tenglong-admin',
  'active',
  '重庆市',
  '一期真实接入场景，覆盖仁科设备、作物周期、农事任务、告警和追溯验收。',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, code) DO UPDATE SET
  name = excluded.name,
  owner_user_id = excluded.owner_user_id,
  status = excluded.status,
  region = excluded.region,
  description = excluded.description,
  updated_at = excluded.updated_at;

INSERT INTO heos_sites (
  id,
  tenant_id,
  project_id,
  code,
  name,
  address,
  boundary_geojson,
  status,
  updated_at
) VALUES (
  'site-tenglong-smart-farm',
  'tenant-tenglong-school',
  'project-tenglong-smart-farm',
  'tlxx-main-campus',
  '腾龙小学智慧农场',
  '腾龙小学劳动教育基地',
  '{"type":"Polygon","coordinates":[]}',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, project_id, code) DO UPDATE SET
  name = excluded.name,
  address = excluded.address,
  boundary_geojson = excluded.boundary_geojson,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_plots (
  id,
  tenant_id,
  site_id,
  code,
  name,
  area_mu,
  boundary_geojson,
  status,
  updated_at
) VALUES (
  'plot-tenglong-vegetable-01',
  'tenant-tenglong-school',
  'site-tenglong-smart-farm',
  'vegetable-01',
  '一号教学菜畦',
  1.2,
  '{"type":"Polygon","coordinates":[]}',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, site_id, code) DO UPDATE SET
  name = excluded.name,
  area_mu = excluded.area_mu,
  boundary_geojson = excluded.boundary_geojson,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_greenhouses (
  id,
  tenant_id,
  plot_id,
  code,
  name,
  greenhouse_type,
  area_square_meter,
  status,
  updated_at
) VALUES (
  'greenhouse-tenglong-01',
  'tenant-tenglong-school',
  'plot-tenglong-vegetable-01',
  'greenhouse-01',
  '一号教学大棚',
  'solar',
  320,
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, plot_id, code) DO UPDATE SET
  name = excluded.name,
  greenhouse_type = excluded.greenhouse_type,
  area_square_meter = excluded.area_square_meter,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_provider_accounts (
  id,
  tenant_id,
  provider_code,
  account_name,
  endpoint_url,
  credential_secret_ref,
  token_secret_ref,
  status,
  updated_at
) VALUES (
  'provider-account-renke-tenglong',
  'tenant-tenglong-school',
  'renke',
  'Renke Tenglong',
  'http://api.farm.0531yun.cn',
  'RENKE_LOGIN_PASSWORD',
  'RENKE_TOKEN',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, provider_code, account_name) DO UPDATE SET
  endpoint_url = excluded.endpoint_url,
  credential_secret_ref = excluded.credential_secret_ref,
  token_secret_ref = excluded.token_secret_ref,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_devices (
  id,
  tenant_id,
  site_id,
  plot_id,
  greenhouse_id,
  provider_account_id,
  external_device_id,
  name,
  device_type,
  capability_codes_json,
  lng,
  lat,
  provider_status,
  online_status,
  last_seen_at,
  status,
  updated_at
) VALUES (
  'device-renke-40406816',
  'tenant-tenglong-school',
  'site-tenglong-smart-farm',
  'plot-tenglong-vegetable-01',
  'greenhouse-tenglong-01',
  'provider-account-renke-tenglong',
  '40406816',
  '仁科四情测报设备 40406816',
  'irrigation3.3',
  '["air_temperature","air_humidity","soil_temperature","soil_moisture","illuminance","co2","battery_voltage","signal_strength"]',
  NULL,
  NULL,
  'unknown',
  'unknown',
  NULL,
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, external_device_id) DO UPDATE SET
  site_id = excluded.site_id,
  plot_id = excluded.plot_id,
  greenhouse_id = excluded.greenhouse_id,
  provider_account_id = excluded.provider_account_id,
  name = excluded.name,
  device_type = excluded.device_type,
  capability_codes_json = excluded.capability_codes_json,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_crop_models (
  id,
  tenant_id,
  crop_code,
  variety_name,
  planting_mode,
  version,
  status,
  updated_at
) VALUES (
  'crop-model-tenglong-lettuce-v1',
  'tenant-tenglong-school',
  'lettuce',
  '教学叶菜',
  'greenhouse',
  'v1',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, crop_code, variety_name, planting_mode, version) DO UPDATE SET
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_crop_model_stages (
  id,
  tenant_id,
  crop_model_id,
  stage_code,
  name,
  sequence,
  metric_targets_json,
  risk_rules_json,
  agri_task_templates_json,
  inspection_requirements_json,
  input_suggestions_json,
  harvest_standard_json,
  updated_at
) VALUES
  (
    'crop-stage-lettuce-seedling',
    'tenant-tenglong-school',
    'crop-model-tenglong-lettuce-v1',
    'seedling',
    '苗期',
    10,
    '{"air_temperature":{"min":16,"max":28},"soil_moisture":{"min":45,"max":75}}',
    '["offline_after_300s","soil_moisture_low"]',
    '["daily_inspection","soil_moisture_check"]',
    '["查看叶色","检查墒情","记录病虫害"]',
    '["少量多次补水"]',
    '{}',
    '2026-06-10T00:00:00.000Z'
  ),
  (
    'crop-stage-lettuce-growing',
    'tenant-tenglong-school',
    'crop-model-tenglong-lettuce-v1',
    'growing',
    '生长期',
    20,
    '{"air_temperature":{"min":15,"max":30},"soil_moisture":{"min":50,"max":80}}',
    '["offline_after_300s","temperature_high"]',
    '["daily_inspection","pest_check"]',
    '["巡检长势","检查虫害","记录投入品"]',
    '["按需补水","避免过量施肥"]',
    '{"leaf_color":"green","pest":"none"}',
    '2026-06-10T00:00:00.000Z'
  )
ON CONFLICT (crop_model_id, stage_code) DO UPDATE SET
  name = excluded.name,
  sequence = excluded.sequence,
  metric_targets_json = excluded.metric_targets_json,
  risk_rules_json = excluded.risk_rules_json,
  agri_task_templates_json = excluded.agri_task_templates_json,
  inspection_requirements_json = excluded.inspection_requirements_json,
  input_suggestions_json = excluded.input_suggestions_json,
  harvest_standard_json = excluded.harvest_standard_json,
  updated_at = excluded.updated_at;

INSERT INTO heos_crop_cycles (
  id,
  tenant_id,
  project_id,
  site_id,
  plot_id,
  greenhouse_id,
  crop_model_id,
  name,
  current_stage_code,
  started_at,
  expected_harvest_at,
  status,
  updated_at
) VALUES (
  'crop-cycle-tenglong-lettuce-2026-summer',
  'tenant-tenglong-school',
  'project-tenglong-smart-farm',
  'site-tenglong-smart-farm',
  'plot-tenglong-vegetable-01',
  'greenhouse-tenglong-01',
  'crop-model-tenglong-lettuce-v1',
  '2026 夏季教学叶菜',
  'seedling',
  '2026-06-01T00:00:00.000Z',
  '2026-07-20T00:00:00.000Z',
  'active',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (id) DO UPDATE SET
  current_stage_code = excluded.current_stage_code,
  expected_harvest_at = excluded.expected_harvest_at,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_agri_tasks (
  id,
  tenant_id,
  crop_cycle_id,
  stage_code,
  task_type,
  title,
  planned_start_at,
  planned_finish_at,
  assignee_user_id,
  status,
  updated_at
) VALUES
  (
    'agri-task-tenglong-daily-inspection',
    'tenant-tenglong-school',
    'crop-cycle-tenglong-lettuce-2026-summer',
    'seedling',
    'inspection',
    '苗期日常巡检',
    '2026-06-11T00:00:00.000Z',
    '2026-06-11T08:00:00.000Z',
    'user-tenglong-admin',
    'planned',
    '2026-06-10T00:00:00.000Z'
  ),
  (
    'agri-task-tenglong-moisture-check',
    'tenant-tenglong-school',
    'crop-cycle-tenglong-lettuce-2026-summer',
    'seedling',
    'measurement',
    '墒情复核',
    '2026-06-12T00:00:00.000Z',
    '2026-06-12T08:00:00.000Z',
    'user-tenglong-admin',
    'planned',
    '2026-06-10T00:00:00.000Z'
  )
ON CONFLICT (id) DO UPDATE SET
  title = excluded.title,
  planned_start_at = excluded.planned_start_at,
  planned_finish_at = excluded.planned_finish_at,
  assignee_user_id = excluded.assignee_user_id,
  status = excluded.status,
  updated_at = excluded.updated_at;

INSERT INTO heos_trace_archives (
  id,
  tenant_id,
  crop_cycle_id,
  public_slug,
  visibility,
  agri_task_record_ids_json,
  input_materials_json,
  inspection_records_json,
  harvest_records_json,
  flow_records_json,
  public_payload_json,
  exported_asset_refs_json,
  updated_at
) VALUES (
  'trace-tenglong-lettuce-2026-summer',
  'tenant-tenglong-school',
  'crop-cycle-tenglong-lettuce-2026-summer',
  'tlxx-lettuce-2026-summer',
  'public',
  '[]',
  '[]',
  '[]',
  '[]',
  '[]',
  '{"project":"腾龙小学智慧农场","crop":"教学叶菜","visibility":"public"}',
  '[]',
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (tenant_id, public_slug) DO UPDATE SET
  visibility = excluded.visibility,
  public_payload_json = excluded.public_payload_json,
  updated_at = excluded.updated_at;

INSERT INTO heos_ai_interactions (
  id,
  trace_id,
  tenant_id,
  user_id,
  scenario,
  model_name,
  input_summary,
  retrieval_sources_json,
  output_summary,
  cost_cents,
  human_confirmation_required,
  created_at
) VALUES (
  'ai-interaction-tenglong-alert-demo',
  'trace-ai-tenglong-alert-demo',
  'tenant-tenglong-school',
  'user-tenglong-admin',
  'alert_explanation',
  'gpt-4.1-mini',
  '解释 40406816 设备离线风险',
  '["heos_devices:device-renke-40406816","heos_sync_runs:sync-run-renke-seed"]',
  '设备最近同步状态需复核，建议先检查供应商在线状态和现场供电。',
  3,
  1,
  '2026-06-10T00:00:00.000Z'
) ON CONFLICT (id) DO UPDATE SET
  input_summary = excluded.input_summary,
  retrieval_sources_json = excluded.retrieval_sources_json,
  output_summary = excluded.output_summary,
  cost_cents = excluded.cost_cents,
  human_confirmation_required = excluded.human_confirmation_required;

INSERT INTO heos_sync_runs (
  id,
  trace_id,
  tenant_id,
  provider_account_id,
  provider_code,
  started_at,
  finished_at,
  device_count,
  success_count,
  failed_count,
  status,
  error_code,
  error_message,
  queue_message_id
) VALUES (
  'sync-run-renke-seed',
  'trace-renke-seed',
  'tenant-tenglong-school',
  'provider-account-renke-tenglong',
  'renke',
  '2026-06-10T00:00:00.000Z',
  '2026-06-10T00:00:01.000Z',
  1,
  0,
  0,
  'retry_pending',
  NULL,
  '等待生产定时同步触发',
  NULL
) ON CONFLICT (id) DO UPDATE SET
  finished_at = excluded.finished_at,
  device_count = excluded.device_count,
  success_count = excluded.success_count,
  failed_count = excluded.failed_count,
  status = excluded.status,
  error_code = excluded.error_code,
  error_message = excluded.error_message,
  queue_message_id = excluded.queue_message_id;
