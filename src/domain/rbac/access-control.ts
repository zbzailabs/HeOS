export const dataScopes = {
  ALL: "all",
  TENANT: "tenant",
  ORG_TREE: "org_tree",
  ASSIGNED_PROJECTS: "assigned_projects",
  READONLY_PUBLIC: "readonly_public",
} as const

export type DataScope = (typeof dataScopes)[keyof typeof dataScopes]

export const dataScopeDefinitions = {
  [dataScopes.ALL]: {
    label: "All platform data",
    description: "Platform administrator access across tenants.",
  },
  [dataScopes.TENANT]: {
    label: "Current tenant",
    description: "Access limited to the current tenant.",
  },
  [dataScopes.ORG_TREE]: {
    label: "Current organization tree",
    description: "Access limited to the current organization and descendants.",
  },
  [dataScopes.ASSIGNED_PROJECTS]: {
    label: "Assigned projects",
    description: "Access limited to projects assigned to the user.",
  },
  [dataScopes.READONLY_PUBLIC]: {
    label: "Readonly public data",
    description: "Readonly access for public, supervision, or teaching views.",
  },
} as const satisfies Record<DataScope, { label: string; description: string }>

export const permissionCodes = {
  TENANT_USER_READ: "tenant:user:read",
  TENANT_USER_WRITE: "tenant:user:write",
  TENANT_ROLE_READ: "tenant:role:read",
  TENANT_ROLE_WRITE: "tenant:role:write",
  PROJECT_SITE_READ: "project:site:read",
  PROJECT_SITE_WRITE: "project:site:write",
  DEVICE_TELEMETRY_READ: "device:telemetry:read",
  DEVICE_CONTROL_REQUEST: "device:control:request",
  ALERT_RULE_WRITE: "alert:rule:write",
  TRACE_ARCHIVE_EXPORT: "trace:archive:export",
  SYSTEM_AUDIT_READ: "system:audit:read",
  SYSTEM_CONFIG_WRITE: "system:config:write",
} as const

export type PermissionCode =
  (typeof permissionCodes)[keyof typeof permissionCodes]

export const permissionDefinitions = {
  [permissionCodes.TENANT_USER_READ]: {
    domain: "tenant",
    resource: "user",
    action: "read",
    riskLevel: "normal",
  },
  [permissionCodes.TENANT_USER_WRITE]: {
    domain: "tenant",
    resource: "user",
    action: "write",
    riskLevel: "normal",
  },
  [permissionCodes.TENANT_ROLE_READ]: {
    domain: "tenant",
    resource: "role",
    action: "read",
    riskLevel: "normal",
  },
  [permissionCodes.TENANT_ROLE_WRITE]: {
    domain: "tenant",
    resource: "role",
    action: "write",
    riskLevel: "normal",
  },
  [permissionCodes.PROJECT_SITE_READ]: {
    domain: "project",
    resource: "site",
    action: "read",
    riskLevel: "normal",
  },
  [permissionCodes.PROJECT_SITE_WRITE]: {
    domain: "project",
    resource: "site",
    action: "write",
    riskLevel: "normal",
  },
  [permissionCodes.DEVICE_TELEMETRY_READ]: {
    domain: "device",
    resource: "telemetry",
    action: "read",
    riskLevel: "normal",
  },
  [permissionCodes.DEVICE_CONTROL_REQUEST]: {
    domain: "device",
    resource: "control",
    action: "request",
    riskLevel: "high",
  },
  [permissionCodes.ALERT_RULE_WRITE]: {
    domain: "alert",
    resource: "rule",
    action: "write",
    riskLevel: "normal",
  },
  [permissionCodes.TRACE_ARCHIVE_EXPORT]: {
    domain: "trace",
    resource: "archive",
    action: "export",
    riskLevel: "high",
  },
  [permissionCodes.SYSTEM_AUDIT_READ]: {
    domain: "system",
    resource: "audit",
    action: "read",
    riskLevel: "normal",
  },
  [permissionCodes.SYSTEM_CONFIG_WRITE]: {
    domain: "system",
    resource: "config",
    action: "write",
    riskLevel: "high",
  },
} as const satisfies Record<
  PermissionCode,
  {
    domain: string
    resource: string
    action: string
    riskLevel: "normal" | "high"
  }
>

export type ConsoleMenuItem = {
  id: string
  parentId: string | null
  title: string
  route: string
  icon: string
  permissionCode: PermissionCode | null
  order: number
  visible: boolean
}

export const consoleMenuItems = [
  {
    id: "dashboard",
    parentId: null,
    title: "Dashboard",
    route: "/console",
    icon: "layout-dashboard",
    permissionCode: null,
    order: 10,
    visible: true,
  },
  {
    id: "tenant",
    parentId: null,
    title: "Tenant access",
    route: "/console/tenant",
    icon: "shield-check",
    permissionCode: permissionCodes.TENANT_USER_READ,
    order: 20,
    visible: true,
  },
  {
    id: "tenant-users",
    parentId: "tenant",
    title: "Users",
    route: "/console/tenant/users",
    icon: "users",
    permissionCode: permissionCodes.TENANT_USER_READ,
    order: 21,
    visible: true,
  },
  {
    id: "tenant-roles",
    parentId: "tenant",
    title: "Roles",
    route: "/console/tenant/roles",
    icon: "key-round",
    permissionCode: permissionCodes.TENANT_ROLE_READ,
    order: 22,
    visible: true,
  },
  {
    id: "assets",
    parentId: null,
    title: "Assets",
    route: "/console/assets",
    icon: "map",
    permissionCode: permissionCodes.PROJECT_SITE_READ,
    order: 30,
    visible: true,
  },
  {
    id: "monitoring",
    parentId: null,
    title: "Monitoring",
    route: "/console/monitoring",
    icon: "activity",
    permissionCode: permissionCodes.DEVICE_TELEMETRY_READ,
    order: 40,
    visible: true,
  },
  {
    id: "system",
    parentId: null,
    title: "System",
    route: "/console/system",
    icon: "settings",
    permissionCode: permissionCodes.SYSTEM_AUDIT_READ,
    order: 90,
    visible: true,
  },
] as const satisfies readonly ConsoleMenuItem[]

export const rbacTableNames = {
  TENANTS: "heos_tenants",
  ORG_UNITS: "heos_org_units",
  USERS: "heos_users",
  POSTS: "heos_posts",
  ROLES: "heos_roles",
  MENUS: "heos_menus",
  PERMISSIONS: "heos_permissions",
  ROLE_PERMISSIONS: "heos_role_permissions",
  USER_ROLES: "heos_user_roles",
  DATA_SCOPES: "heos_data_scopes",
  ROLE_DATA_SCOPES: "heos_role_data_scopes",
  AUDIT_LOGS: "heos_audit_logs",
} as const

export type RbacTableName = (typeof rbacTableNames)[keyof typeof rbacTableNames]

