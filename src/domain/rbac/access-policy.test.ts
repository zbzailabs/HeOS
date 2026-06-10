import { describe, expect, it } from "vitest"

import { dataScopes, permissionCodes } from "./access-control"
import {
  checkEveryPermission,
  createBootstrapAdminAccessContext,
  filterConsoleMenuItems,
  getAccessSummary,
  hasAnyPermission,
  hasPermission,
  resolveAccessContext,
  type AccessContext,
} from "./access-policy"

const adminUser = {
  email: "admin@example.com",
  name: "admin@example.com",
}

function createReadonlyContext(): AccessContext {
  return {
    user: adminUser,
    tenantId: "tenant-demo",
    roleIds: ["readonly"],
    permissionCodes: [
      permissionCodes.PROJECT_SITE_READ,
      permissionCodes.DEVICE_TELEMETRY_READ,
    ],
    dataScope: dataScopes.READONLY_PUBLIC,
  }
}

describe("server access policy", () => {
  it("returns no access context for anonymous users", () => {
    expect(resolveAccessContext(null)).toBeNull()
    expect(filterConsoleMenuItems(null)).toEqual([])
    expect(getAccessSummary(null)).toMatchObject({
      authenticated: false,
      permissionCount: 0,
    })
  })

  it("maps the bootstrap administrator to all current permissions", () => {
    const context = createBootstrapAdminAccessContext(adminUser)

    expect(context.tenantId).toBe("platform")
    expect(context.roleIds).toEqual(["platform-admin"])
    expect(context.dataScope).toBe(dataScopes.ALL)
    expect(context.permissionCodes).toEqual(Object.values(permissionCodes))
  })

  it("checks single, any, and every permission", () => {
    const context = createReadonlyContext()

    expect(hasPermission(context, permissionCodes.PROJECT_SITE_READ)).toBe(true)
    expect(hasPermission(context, permissionCodes.TENANT_USER_WRITE)).toBe(false)
    expect(
      hasAnyPermission(context, [
        permissionCodes.TENANT_USER_WRITE,
        permissionCodes.DEVICE_TELEMETRY_READ,
      ]),
    ).toBe(true)
    expect(
      checkEveryPermission(context, [
        permissionCodes.PROJECT_SITE_READ,
        permissionCodes.DEVICE_TELEMETRY_READ,
      ]),
    ).toEqual({
      allowed: true,
      missingPermissionCodes: [],
    })
  })

  it("filters console menus by server-side permissions", () => {
    const readonlyMenuRoutes = filterConsoleMenuItems(createReadonlyContext()).map(
      (menuItem) => menuItem.route,
    )

    expect(readonlyMenuRoutes).toContain("/console")
    expect(readonlyMenuRoutes).toContain("/console/assets")
    expect(readonlyMenuRoutes).toContain("/console/monitoring")
    expect(readonlyMenuRoutes).not.toContain("/console/tenant")
    expect(readonlyMenuRoutes).not.toContain("/console/system")
  })

  it("rejects high-risk device control for readonly contexts", () => {
    const result = checkEveryPermission(createReadonlyContext(), [
      permissionCodes.DEVICE_CONTROL_REQUEST,
    ])

    expect(result).toEqual({
      allowed: false,
      missingPermissionCodes: [permissionCodes.DEVICE_CONTROL_REQUEST],
    })
  })
})

