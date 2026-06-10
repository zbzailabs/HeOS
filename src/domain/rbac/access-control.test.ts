import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  consoleMenuItems,
  dataScopes,
  permissionCodes,
  permissionDefinitions,
  rbacTableNames,
} from "./access-control"

const migrationSql = readFileSync(
  new URL("../../../db/migrations/0001_heos_rbac_core.sql", import.meta.url),
  "utf8",
)

function expectUniqueValues(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe("RBAC access-control definitions", () => {
  it("keeps permission codes unique", () => {
    expectUniqueValues(Object.values(permissionCodes))
  })

  it("keeps data scopes unique", () => {
    expectUniqueValues(Object.values(dataScopes))
  })

  it("keeps high-risk device control separate from telemetry read access", () => {
    expect(permissionCodes.DEVICE_CONTROL_REQUEST).toBe("device:control:request")
    expect(permissionDefinitions[permissionCodes.DEVICE_CONTROL_REQUEST]).toMatchObject({
      domain: "device",
      resource: "control",
      action: "request",
      riskLevel: "high",
    })
    expect(permissionCodes.DEVICE_CONTROL_REQUEST).not.toBe(
      permissionCodes.DEVICE_TELEMETRY_READ,
    )
  })

  it("only references defined permission codes from console menus", () => {
    const definedPermissionCodes = new Set(Object.values(permissionCodes))

    for (const menuItem of consoleMenuItems) {
      if (menuItem.permissionCode) {
        expect(definedPermissionCodes.has(menuItem.permissionCode)).toBe(true)
      }
    }
  })
})

describe("RBAC D1 migration", () => {
  it("creates every required RBAC table", () => {
    for (const tableName of Object.values(rbacTableNames)) {
      expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${tableName}`)
    }
  })

  it("declares key D1 indexes for authorization queries and audit lookups", () => {
    expect(migrationSql).toContain("idx_heos_users_tenant_org")
    expect(migrationSql).toContain("idx_heos_roles_tenant_status")
    expect(migrationSql).toContain("idx_heos_menus_parent_order")
    expect(migrationSql).toContain("idx_heos_audit_logs_tenant_created")
    expect(migrationSql).toContain("idx_heos_audit_logs_trace")
  })

  it("uses SQLite-compatible column choices for D1", () => {
    expect(migrationSql).not.toMatch(/\bSERIAL\b/i)
    expect(migrationSql).not.toMatch(/\bVARCHAR\b/i)
    expect(migrationSql).toContain("visible INTEGER NOT NULL DEFAULT 1")
    expect(migrationSql).toContain("is_system INTEGER NOT NULL DEFAULT 0")
  })
})

