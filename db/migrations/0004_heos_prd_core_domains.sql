PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS heos_projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('planning', 'active', 'paused', 'archived')
  ),
  region TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (owner_user_id) REFERENCES heos_users(id)
);

CREATE TABLE IF NOT EXISTS heos_sites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  boundary_geojson TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, project_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (project_id) REFERENCES heos_projects(id)
);

CREATE TABLE IF NOT EXISTS heos_plots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  area_mu REAL,
  boundary_geojson TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, site_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (site_id) REFERENCES heos_sites(id)
);

CREATE TABLE IF NOT EXISTS heos_greenhouses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plot_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  greenhouse_type TEXT NOT NULL DEFAULT 'solar',
  area_square_meter REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, plot_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (plot_id) REFERENCES heos_plots(id)
);

CREATE TABLE IF NOT EXISTS heos_provider_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  credential_secret_ref TEXT NOT NULL,
  token_secret_ref TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'disabled', 'auth_failed')
  ),
  last_auth_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, provider_code, account_name),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  plot_id TEXT,
  greenhouse_id TEXT,
  provider_account_id TEXT,
  external_device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  capability_codes_json TEXT NOT NULL DEFAULT '[]',
  lng REAL,
  lat REAL,
  provider_status TEXT NOT NULL DEFAULT 'unknown',
  online_status TEXT NOT NULL DEFAULT 'unknown' CHECK (
    online_status IN ('online', 'offline', 'unknown')
  ),
  last_seen_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, external_device_id),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (site_id) REFERENCES heos_sites(id),
  FOREIGN KEY (plot_id) REFERENCES heos_plots(id),
  FOREIGN KEY (greenhouse_id) REFERENCES heos_greenhouses(id),
  FOREIGN KEY (provider_account_id) REFERENCES heos_provider_accounts(id)
);

CREATE TABLE IF NOT EXISTS heos_device_metric_mappings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  source_metric_key TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  unit TEXT NOT NULL,
  transform_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, device_id, source_metric_key),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (device_id) REFERENCES heos_devices(id)
);

CREATE TABLE IF NOT EXISTS heos_crop_models (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  crop_code TEXT NOT NULL,
  variety_name TEXT,
  planting_mode TEXT NOT NULL,
  version TEXT NOT NULL,
  source_model_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('draft', 'active', 'archived')
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, crop_code, variety_name, planting_mode, version),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (source_model_id) REFERENCES heos_crop_models(id)
);

CREATE TABLE IF NOT EXISTS heos_crop_model_stages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  crop_model_id TEXT NOT NULL,
  stage_code TEXT NOT NULL,
  name TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  metric_targets_json TEXT NOT NULL DEFAULT '{}',
  risk_rules_json TEXT NOT NULL DEFAULT '[]',
  agri_task_templates_json TEXT NOT NULL DEFAULT '[]',
  inspection_requirements_json TEXT NOT NULL DEFAULT '[]',
  input_suggestions_json TEXT NOT NULL DEFAULT '[]',
  harvest_standard_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (crop_model_id, stage_code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (crop_model_id) REFERENCES heos_crop_models(id)
);

CREATE TABLE IF NOT EXISTS heos_crop_cycles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  plot_id TEXT,
  greenhouse_id TEXT,
  crop_model_id TEXT NOT NULL,
  name TEXT NOT NULL,
  current_stage_code TEXT,
  started_at TEXT NOT NULL,
  expected_harvest_at TEXT,
  actual_harvest_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('planned', 'active', 'harvested', 'closed')
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (project_id) REFERENCES heos_projects(id),
  FOREIGN KEY (site_id) REFERENCES heos_sites(id),
  FOREIGN KEY (plot_id) REFERENCES heos_plots(id),
  FOREIGN KEY (greenhouse_id) REFERENCES heos_greenhouses(id),
  FOREIGN KEY (crop_model_id) REFERENCES heos_crop_models(id)
);

CREATE TABLE IF NOT EXISTS heos_agri_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  crop_cycle_id TEXT NOT NULL,
  stage_code TEXT,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  planned_start_at TEXT,
  planned_finish_at TEXT,
  assignee_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (
    status IN ('planned', 'doing', 'done', 'cancelled')
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES heos_crop_cycles(id),
  FOREIGN KEY (assignee_user_id) REFERENCES heos_users(id)
);

CREATE TABLE IF NOT EXISTS heos_agri_task_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agri_task_id TEXT NOT NULL,
  executed_by_user_id TEXT,
  executed_at TEXT NOT NULL,
  location_json TEXT,
  photo_asset_refs_json TEXT NOT NULL DEFAULT '[]',
  input_materials_json TEXT NOT NULL DEFAULT '[]',
  labor_json TEXT NOT NULL DEFAULT '[]',
  machinery_json TEXT NOT NULL DEFAULT '[]',
  acceptance_result TEXT NOT NULL DEFAULT 'pending' CHECK (
    acceptance_result IN ('pending', 'accepted', 'rejected')
  ),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (agri_task_id) REFERENCES heos_agri_tasks(id),
  FOREIGN KEY (executed_by_user_id) REFERENCES heos_users(id)
);

CREATE TABLE IF NOT EXISTS heos_standard_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  rule_type TEXT NOT NULL CHECK (
    rule_type IN ('threshold', 'offline', 'provider', 'crop_risk')
  ),
  name TEXT NOT NULL,
  metric_code TEXT,
  lower_threshold REAL,
  upper_threshold REAL,
  stage_code TEXT,
  action_json TEXT NOT NULL DEFAULT '{}',
  version TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_by TEXT NOT NULL DEFAULT 'system-rule',
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('draft', 'active', 'archived')
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_alerts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT,
  site_id TEXT NOT NULL,
  device_id TEXT,
  crop_cycle_id TEXT,
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
  threshold_json TEXT,
  value_observed REAL,
  reason TEXT NOT NULL,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'acknowledged', 'assigned', 'resolved', 'closed')
  ),
  acknowledged_by_user_id TEXT,
  acknowledged_at TEXT,
  assigned_to_user_id TEXT,
  resolved_at TEXT,
  closed_at TEXT,
  recovery_record_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (project_id) REFERENCES heos_projects(id),
  FOREIGN KEY (site_id) REFERENCES heos_sites(id),
  FOREIGN KEY (device_id) REFERENCES heos_devices(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES heos_crop_cycles(id),
  FOREIGN KEY (rule_id) REFERENCES heos_standard_rules(id),
  FOREIGN KEY (acknowledged_by_user_id) REFERENCES heos_users(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES heos_users(id)
);

CREATE TABLE IF NOT EXISTS heos_control_commands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'disabled' CHECK (
    approval_status IN ('disabled', 'pending_approval', 'approved', 'rejected')
  ),
  requested_by_user_id TEXT,
  approved_by_user_id TEXT,
  approved_at TEXT,
  receipt_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (
    receipt_status IN ('not_sent', 'sent', 'acknowledged', 'failed')
  ),
  receipt_json TEXT,
  audit_log_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (device_id) REFERENCES heos_devices(id),
  FOREIGN KEY (requested_by_user_id) REFERENCES heos_users(id),
  FOREIGN KEY (approved_by_user_id) REFERENCES heos_users(id),
  FOREIGN KEY (audit_log_id) REFERENCES heos_audit_logs(id)
);

CREATE TABLE IF NOT EXISTS heos_trace_archives (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  crop_cycle_id TEXT NOT NULL,
  public_slug TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (
    visibility IN ('private', 'public', 'supervision')
  ),
  agri_task_record_ids_json TEXT NOT NULL DEFAULT '[]',
  input_materials_json TEXT NOT NULL DEFAULT '[]',
  inspection_records_json TEXT NOT NULL DEFAULT '[]',
  harvest_records_json TEXT NOT NULL DEFAULT '[]',
  flow_records_json TEXT NOT NULL DEFAULT '[]',
  public_payload_json TEXT NOT NULL DEFAULT '{}',
  exported_asset_refs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, public_slug),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES heos_crop_cycles(id)
);

CREATE TABLE IF NOT EXISTS heos_ai_interactions (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  scenario TEXT NOT NULL CHECK (
    scenario IN (
      'crop_qa',
      'stage_advice',
      'alert_explanation',
      'agri_advice',
      'report_summary'
    )
  ),
  model_name TEXT NOT NULL,
  input_summary TEXT NOT NULL,
  retrieval_sources_json TEXT NOT NULL DEFAULT '[]',
  output_summary TEXT NOT NULL,
  cost_cents REAL NOT NULL DEFAULT 0,
  human_confirmation_required INTEGER NOT NULL DEFAULT 0 CHECK (
    human_confirmation_required IN (0, 1)
  ),
  audit_log_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (user_id) REFERENCES heos_users(id),
  FOREIGN KEY (audit_log_id) REFERENCES heos_audit_logs(id)
);

CREATE TABLE IF NOT EXISTS heos_reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT,
  crop_cycle_id TEXT,
  report_type TEXT NOT NULL CHECK (
    report_type IN ('daily', 'weekly', 'monthly', 'project', 'supervision')
  ),
  title TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'ready', 'exported')
  ),
  html_snapshot TEXT,
  export_asset_refs_json TEXT NOT NULL DEFAULT '[]',
  created_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (project_id) REFERENCES heos_projects(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES heos_crop_cycles(id),
  FOREIGN KEY (created_by_user_id) REFERENCES heos_users(id)
);

CREATE TABLE IF NOT EXISTS heos_sync_runs (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider_account_id TEXT,
  provider_code TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  device_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (
    status IN (
      'success',
      'partial_success',
      'failed',
      'retry_pending',
      'auth_timeout',
      'source_timeout',
      'schema_mismatch'
    )
  ),
  error_code TEXT,
  error_message TEXT,
  queue_message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (provider_account_id) REFERENCES heos_provider_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_projects_tenant_status
  ON heos_projects (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_heos_sites_project
  ON heos_sites (tenant_id, project_id);

CREATE INDEX IF NOT EXISTS idx_heos_plots_site
  ON heos_plots (tenant_id, site_id);

CREATE INDEX IF NOT EXISTS idx_heos_greenhouses_plot
  ON heos_greenhouses (tenant_id, plot_id);

CREATE INDEX IF NOT EXISTS idx_heos_devices_site_status
  ON heos_devices (tenant_id, site_id, online_status);

CREATE INDEX IF NOT EXISTS idx_heos_crop_cycles_project_status
  ON heos_crop_cycles (tenant_id, project_id, status);

CREATE INDEX IF NOT EXISTS idx_heos_agri_tasks_cycle_status
  ON heos_agri_tasks (tenant_id, crop_cycle_id, status);

CREATE INDEX IF NOT EXISTS idx_heos_alerts_site_status
  ON heos_alerts (tenant_id, site_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_alerts_device_type
  ON heos_alerts (tenant_id, device_id, alert_type, status);

CREATE INDEX IF NOT EXISTS idx_heos_control_commands_device_status
  ON heos_control_commands (tenant_id, device_id, approval_status);

CREATE INDEX IF NOT EXISTS idx_heos_trace_archives_public
  ON heos_trace_archives (public_slug, visibility);

CREATE INDEX IF NOT EXISTS idx_heos_ai_interactions_tenant_created
  ON heos_ai_interactions (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_reports_project_period
  ON heos_reports (tenant_id, project_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_heos_sync_runs_provider_started
  ON heos_sync_runs (tenant_id, provider_code, started_at);
