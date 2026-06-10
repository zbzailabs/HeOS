PRAGMA foreign_keys = ON;

ALTER TABLE heos_audit_logs ADD COLUMN event_type TEXT;
ALTER TABLE heos_audit_logs ADD COLUMN target_name TEXT;
ALTER TABLE heos_audit_logs ADD COLUMN result_reason TEXT;
ALTER TABLE heos_audit_logs ADD COLUMN source TEXT;
ALTER TABLE heos_audit_logs ADD COLUMN request_method TEXT;
ALTER TABLE heos_audit_logs ADD COLUMN request_path TEXT;

CREATE INDEX IF NOT EXISTS idx_heos_audit_logs_tenant_action_created
  ON heos_audit_logs (tenant_id, action, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_audit_logs_user_created
  ON heos_audit_logs (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_audit_logs_event_type_created
  ON heos_audit_logs (event_type, created_at);
