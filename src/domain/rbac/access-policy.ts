import {
  consoleMenuItems,
  dataScopes,
  type ConsoleMenuItem,
  type DataScope,
  type PermissionCode,
  permissionCodes,
} from "./access-control"

export type AccessUser = {
  email: string
  name: string
}

export type AccessContext = {
  user: AccessUser
  tenantId: string
  roleIds: string[]
  permissionCodes: PermissionCode[]
  dataScope: DataScope
}

export type PermissionCheckResult = {
  allowed: boolean
  missingPermissionCodes: PermissionCode[]
}

export function createBootstrapAdminAccessContext(
  user: AccessUser,
): AccessContext {
  return {
    user,
    tenantId: "platform",
    roleIds: ["platform-admin"],
    permissionCodes: Object.values(permissionCodes),
    dataScope: dataScopes.ALL,
  }
}

export function resolveAccessContext(
  user: AccessUser | null,
): AccessContext | null {
  if (!user) {
    return null
  }

  return createBootstrapAdminAccessContext(user)
}

export function hasPermission(
  context: AccessContext | null,
  permissionCode: PermissionCode,
) {
  return Boolean(context?.permissionCodes.includes(permissionCode))
}

export function hasAnyPermission(
  context: AccessContext | null,
  permissionCodesToCheck: readonly PermissionCode[],
) {
  return permissionCodesToCheck.some((permissionCode) =>
    hasPermission(context, permissionCode),
  )
}

export function checkEveryPermission(
  context: AccessContext | null,
  permissionCodesToCheck: readonly PermissionCode[],
): PermissionCheckResult {
  const missingPermissionCodes = permissionCodesToCheck.filter(
    (permissionCode) => !hasPermission(context, permissionCode),
  )

  return {
    allowed: missingPermissionCodes.length === 0,
    missingPermissionCodes,
  }
}

export function filterConsoleMenuItems(
  context: AccessContext | null,
): ConsoleMenuItem[] {
  if (!context) {
    return []
  }

  return consoleMenuItems.filter((menuItem) => {
    if (!menuItem.visible) {
      return false
    }

    if (!menuItem.permissionCode) {
      return true
    }

    return hasPermission(context, menuItem.permissionCode)
  })
}

export function getAccessSummary(context: AccessContext | null) {
  if (!context) {
    return {
      authenticated: false,
      tenantId: null,
      roleIds: [],
      dataScope: null,
      permissionCount: 0,
    }
  }

  return {
    authenticated: true,
    tenantId: context.tenantId,
    roleIds: context.roleIds,
    dataScope: context.dataScope,
    permissionCount: context.permissionCodes.length,
  }
}

