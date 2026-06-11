CREATE TABLE IF NOT EXISTS heos_ai_review_actions (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  interaction_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('confirm', 'reject')),
  status_after_action TEXT NOT NULL CHECK (
    status_after_action IN ('confirmed', 'rejected')
  ),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (interaction_id) REFERENCES heos_ai_interactions(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_ai_review_actions_tenant_interaction
  ON heos_ai_review_actions (tenant_id, interaction_id, created_at);
