import { describe, expect, test } from "vitest"

import { dataScopes, permissionCodes } from "./access-control"
import type { AccessContext } from "./access-policy"
import {
  checkProductionWriteAccess,
  productionWriteActions,
} from "./production-write-auth"

const adminContext: AccessContext = {
  user: {
    email: "admin@heos.local",
    name: "Admin",
  },
  tenantId: "platform",
  roleIds: ["platform-admin"],
  permissionCodes: Object.values(permissionCodes),
  dataScope: dataScopes.ALL,
}

describe("checkProductionWriteAccess", () => {
  test("rejects unauthenticated production write requests", () => {
    const result = checkProductionWriteAccess({
      context: null,
      tenantId: "tenant-tenglong-school",
      action: productionWriteActions.ALERT_STATUS_UPDATE,
    })

    expect(result).toEqual({
      allowed: false,
      status: 401,
      userId: null,
      errors: [
        {
          code: "AUTHENTICATION_REQUIRED",
          message: "Login is required before production write actions.",
        },
      ],
    })
  })

  test("rejects users missing the required write permission", () => {
    const result = checkProductionWriteAccess({
      context: {
        ...adminContext,
        permissionCodes: [permissionCodes.ALERT_READ],
      },
      tenantId: "tenant-tenglong-school",
      action: productionWriteActions.ALERT_STATUS_UPDATE,
    })

    expect(result.allowed).toBe(false)
    expect(result.status).toBe(403)
    expect(result.errors).toEqual([
      {
        code: "PERMISSION_DENIED",
        message: "Production write permission is missing.",
        missingPermissionCodes: [permissionCodes.ALERT_WRITE],
      },
    ])
  })

  test("rejects tenant scoped users writing another tenant", () => {
    const result = checkProductionWriteAccess({
      context: {
        ...adminContext,
        tenantId: "tenant-a",
        dataScope: dataScopes.TENANT,
      },
      tenantId: "tenant-b",
      action: productionWriteActions.AGRI_TASK_STATUS_UPDATE,
    })

    expect(result).toEqual({
      allowed: false,
      status: 403,
      userId: null,
      errors: [
        {
          code: "TENANT_SCOPE_DENIED",
          message: "Production write tenant is outside the current data scope.",
        },
      ],
    })
  })

  test("allows platform admins to write a production tenant", () => {
    const result = checkProductionWriteAccess({
      context: adminContext,
      tenantId: "tenant-tenglong-school",
      action: productionWriteActions.RENKE_SYNC,
    })

    expect(result).toEqual({
      allowed: true,
      status: 200,
      userId: "admin@heos.local",
      errors: [],
    })
  })
})
