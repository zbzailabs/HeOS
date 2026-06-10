PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS heos_tenants (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS heos_org_units (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  parent_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'department',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (parent_id) REFERENCES heos_org_units(id)
);

CREATE TABLE IF NOT EXISTS heos_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  org_unit_id TEXT,
  post_id TEXT,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (org_unit_id) REFERENCES heos_org_units(id),
  FOREIGN KEY (post_id) REFERENCES heos_posts(id)
);

CREATE TABLE IF NOT EXISTS heos_roles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id)
);

CREATE TABLE IF NOT EXISTS heos_permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'normal' CHECK (risk_level IN ('normal', 'high')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS heos_menus (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  title TEXT NOT NULL,
  route TEXT NOT NULL,
  icon TEXT NOT NULL,
  permission_code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (route),
  FOREIGN KEY (parent_id) REFERENCES heos_menus(id),
  FOREIGN KEY (permission_code) REFERENCES heos_permissions(code)
);

CREATE TABLE IF NOT EXISTS heos_role_permissions (
  role_id TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (role_id, permission_code),
  FOREIGN KEY (role_id) REFERENCES heos_roles(id),
  FOREIGN KEY (permission_code) REFERENCES heos_permissions(code)
);

CREATE TABLE IF NOT EXISTS heos_user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES heos_users(id),
  FOREIGN KEY (role_id) REFERENCES heos_roles(id)
);

CREATE TABLE IF NOT EXISTS heos_data_scopes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS heos_role_data_scopes (
  role_id TEXT NOT NULL,
  data_scope_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (role_id, data_scope_code),
  FOREIGN KEY (role_id) REFERENCES heos_roles(id),
  FOREIGN KEY (data_scope_code) REFERENCES heos_data_scopes(code)
);

CREATE TABLE IF NOT EXISTS heos_audit_logs (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  latency_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (user_id) REFERENCES heos_users(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_org_units_tenant_parent
  ON heos_org_units (tenant_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_heos_users_tenant_org
  ON heos_users (tenant_id, org_unit_id);

CREATE INDEX IF NOT EXISTS idx_heos_roles_tenant_status
  ON heos_roles (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_heos_menus_parent_order
  ON heos_menus (parent_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_heos_permissions_domain_resource
  ON heos_permissions (domain, resource);

CREATE INDEX IF NOT EXISTS idx_heos_audit_logs_tenant_created
  ON heos_audit_logs (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_heos_audit_logs_trace
  ON heos_audit_logs (trace_id);

