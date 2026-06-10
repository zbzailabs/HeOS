import { describe, expect, it } from "vitest"

import { consoleMenuItems, dataScopes, permissionCodes } from "./access-control"
import {
  consoleModules,
  getConsoleMenuTree,
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

  it("builds a first and second level menu tree for current backend capabilities", () => {
    const menuTree = getConsoleMenuTree(consoleMenuItems)

    expect(menuTree.map((item) => item.title)).toEqual([
      "工作台",
      "租户与权限",
      "基地资产",
      "标准与字典",
      "监测与告警",
      "同步与供应商",
      "系统与审计",
    ])

    expect(
      menuTree.find((item) => item.id === "standards")?.children.map(
        (item) => item.title,
      ),
    ).toEqual(["标准字典", "遥测指标", "规则校验"])
    expect(
      menuTree.find((item) => item.id === "monitoring")?.children.map(
        (item) => item.title,
      ),
    ).toEqual(["实时遥测", "历史查询", "告警中心", "规则管理"])
    expect(
      menuTree.find((item) => item.id === "system")?.children.map(
        (item) => item.title,
      ),
    ).toEqual(["审计日志", "运行状态", "发布合规"])
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
      menuCount: 7,
      childMenuCount: consoleMenuItems.length - 7,
      moduleCount: consoleModules.length,
      configuredMenuCount: consoleMenuItems.length,
    })
  })
})
