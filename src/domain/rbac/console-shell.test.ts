import { describe, expect, it } from "vitest"

import { consoleMenuItems, dataScopes, permissionCodes } from "./access-control"
import {
  consoleModules,
  getConsoleModuleAccess,
  getConsoleShellMetrics,
  getVisibleConsoleMenuRoutes,
} from "./console-shell"
import type { AccessContext } from "./access-policy"

const readonlyContext: AccessContext = {
  user: {
    email: "viewer@example.com",
    name: "viewer@example.com",
  },
  tenantId: "tenant-demo",
  roleIds: ["readonly"],
  permissionCodes: [permissionCodes.PROJECT_SITE_READ],
  dataScope: dataScopes.READONLY_PUBLIC,
}

describe("console shell helpers", () => {
  it("keeps console modules tied to defined menu routes", () => {
    const menuRoutes = new Set(consoleMenuItems.map((menuItem) => menuItem.route))

    for (const module of consoleModules) {
      expect(menuRoutes.has(module.route)).toBe(true)
    }
  })

  it("filters visible menu routes", () => {
    expect(getVisibleConsoleMenuRoutes(consoleMenuItems)).toContain("/console")
    expect(getVisibleConsoleMenuRoutes(consoleMenuItems)).toContain(
      "/console/assets",
    )
  })

  it("marks modules unavailable when the context lacks permission", () => {
    const access = getConsoleModuleAccess(readonlyContext)

    expect(access.find((module) => module.id === "asset-management")).toMatchObject({
      allowed: true,
    })
    expect(access.find((module) => module.id === "tenant-access")).toMatchObject({
      allowed: false,
    })
  })

  it("summarizes visible menu and module counts", () => {
    expect(getConsoleShellMetrics(readonlyContext, consoleMenuItems)).toMatchObject({
      menuCount: consoleMenuItems.length,
      moduleCount: consoleModules.length,
      configuredMenuCount: consoleMenuItems.length,
    })
  })
})

