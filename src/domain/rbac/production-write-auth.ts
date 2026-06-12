import {
  dataScopes,
  permissionCodes,
  type PermissionCode,
} from "./access-control"
import type { AccessContext } from "./access-policy"

export const productionWriteActions = {
  ALERT_STATUS_UPDATE: "alert.status.update",
  AGRI_TASK_STATUS_UPDATE: "agri_task.status.update",
  AI_REVIEW: "ai.review",
  RENKE_SYNC: "renke.sync",
  TRACE_ARCHIVE_EXPORT: "trace.archive.export",
} as const

export type ProductionWriteAction =
  (typeof productionWriteActions)[keyof typeof productionWriteActions]

export type ProductionWriteAccessResult =
  | {
      allowed: true
      status: 200
      userId: string
      errors: []
    }
  | {
      allowed: false
      status: 401 | 403
      userId: null
      errors: ProductionWriteAccessError[]
    }

type ProductionWriteAccessError =
  | {
      code: "AUTHENTICATION_REQUIRED"
      message: string
    }
  | {
      code: "PERMISSION_DENIED"
      message: string
      missingPermissionCodes: PermissionCode[]
    }
  | {
      code: "TENANT_SCOPE_DENIED"
      message: string
    }

const actionPermissionMap = {
  [productionWriteActions.ALERT_STATUS_UPDATE]: permissionCodes.ALERT_WRITE,
  [productionWriteActions.AGRI_TASK_STATUS_UPDATE]:
    permissionCodes.AGRI_TASK_WRITE,
  [productionWriteActions.AI_REVIEW]: permissionCodes.AI_REVIEW_WRITE,
  [productionWriteActions.RENKE_SYNC]: permissionCodes.PROVIDER_SYNC_WRITE,
  [productionWriteActions.TRACE_ARCHIVE_EXPORT]:
    permissionCodes.TRACE_ARCHIVE_EXPORT,
} as const satisfies Record<ProductionWriteAction, PermissionCode>

export function getProductionWritePermission(action: ProductionWriteAction) {
  return actionPermissionMap[action]
}

export function checkProductionWriteAccess(input: {
  context: AccessContext | null
  tenantId: string
  action: ProductionWriteAction
}): ProductionWriteAccessResult {
  if (!input.context) {
    return {
      allowed: false,
      status: 401,
      userId: null,
      errors: [
        {
          code: "AUTHENTICATION_REQUIRED",
          message: "Login is required before production write actions.",
        },
      ],
    }
  }

  const requiredPermission = getProductionWritePermission(input.action)
  if (!input.context.permissionCodes.includes(requiredPermission)) {
    return {
      allowed: false,
      status: 403,
      userId: null,
      errors: [
        {
          code: "PERMISSION_DENIED",
          message: "Production write permission is missing.",
          missingPermissionCodes: [requiredPermission],
        },
      ],
    }
  }

  if (
    input.context.dataScope !== dataScopes.ALL &&
    input.context.tenantId !== input.tenantId
  ) {
    return {
      allowed: false,
      status: 403,
      userId: null,
      errors: [
        {
          code: "TENANT_SCOPE_DENIED",
          message: "Production write tenant is outside the current data scope.",
        },
      ],
    }
  }

  return {
    allowed: true,
    status: 200,
    userId: input.context.user.email,
    errors: [],
  }
}
