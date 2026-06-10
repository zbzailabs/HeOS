export const auditTables = {
  logs: "heos_audit_logs",
} as const

export const auditEventTypes = {
  AUTH_LOGIN: "auth.login",
  TRACE_EXPORT: "trace.export",
  TELEMETRY_QUERY: "telemetry.query",
  DEVICE_CONTROL_REQUEST: "device.control.request",
  POLICY_CHANGE: "policy.change",
  PROVIDER_SYNC: "provider.sync",
} as const

export type AuditEventType =
  (typeof auditEventTypes)[keyof typeof auditEventTypes]

export const auditActions = {
  AUTH_LOGIN: "auth.login",
  TRACE_EXPORT: "trace.export",
  TELEMETRY_QUERY: "telemetry.query",
  DEVICE_CONTROL_REQUEST: "device.control.request",
  POLICY_CHANGE: "policy.change",
  PROVIDER_SYNC: "provider.sync",
} as const

export type AuditAction = (typeof auditActions)[keyof typeof auditActions]

export const auditResults = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const

export type AuditResult = (typeof auditResults)[keyof typeof auditResults]

export type AuditLogInput = {
  traceId: string
  tenantId: string | null
  userId: string | null
  eventType: AuditEventType
  action: AuditAction
  targetType: string
  targetId?: string | null
  targetName?: string | null
  result: AuditResult
  resultReason?: string | null
  latencyMs: number
  source: string
  requestMethod?: string | null
  requestPath?: string | null
  metadataJson?: string | null
  createdAt: string
}

export type AuditLogRecord = Required<
  Omit<
    AuditLogInput,
    "targetId" | "targetName" | "resultReason" | "requestMethod" | "requestPath" | "metadataJson"
  >
> & {
  id: string
  targetId: string | null
  targetName: string | null
  resultReason: string | null
  requestMethod: string | null
  requestPath: string | null
  metadataJson: string | null
}

export type AuditLogWritePlan = {
  table: typeof auditTables.logs
  record: AuditLogRecord
}

export type AuditQueryParams = {
  tenantId?: string
  userId?: string
  action?: AuditAction
  traceId?: string
  fromTs: string
  toTs: string
  limit?: number
}

export type AuditQueryPlan = {
  table: typeof auditTables.logs
  where: string[]
  orderBy: readonly ["created_at DESC", "id DESC"]
  limit: number
  parameters: (number | string)[]
}

export const auditQueryDefaultLimit = 50
export const auditQueryMaxLimit = 200

export const auditModelErrorCodes = {
  INVALID_LATENCY: "AUDIT_INVALID_LATENCY",
  INVALID_TIME_WINDOW: "AUDIT_INVALID_TIME_WINDOW",
  INVALID_LIMIT: "AUDIT_INVALID_LIMIT",
} as const

export type AuditModelValidationError = {
  status: 400
  code: (typeof auditModelErrorCodes)[keyof typeof auditModelErrorCodes]
  message: string
  details: Record<string, number | string>
}

export type AuditModelResult<T> =
  | {
      ok: true
      status: 200
      value: T
    }
  | {
      ok: false
      status: 400
      errors: AuditModelValidationError[]
    }

export function createAuditLogRecord(input: AuditLogInput): AuditLogRecord {
  return {
    id: createStableKey(["audit", input.traceId, input.action, input.createdAt]),
    traceId: input.traceId,
    tenantId: input.tenantId,
    userId: input.userId,
    eventType: input.eventType,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    targetName: input.targetName ?? null,
    result: input.result,
    resultReason: input.resultReason ?? null,
    latencyMs: input.latencyMs,
    source: input.source,
    requestMethod: input.requestMethod ?? null,
    requestPath: input.requestPath ?? null,
    metadataJson: input.metadataJson ?? null,
    createdAt: input.createdAt,
  }
}

export function createAuditLogWritePlan(
  input: AuditLogInput,
): AuditModelResult<AuditLogWritePlan> {
  const errors = validateAuditLogInput(input)

  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    }
  }

  return {
    ok: true,
    status: 200,
    value: {
      table: auditTables.logs,
      record: createAuditLogRecord(input),
    },
  }
}

export function createAuditQueryPlan(
  params: AuditQueryParams,
): AuditModelResult<AuditQueryPlan> {
  const errors = validateAuditQueryParams(params)

  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    }
  }

  const where: string[] = []
  const parameters: (number | string)[] = []

  if (params.tenantId) {
    where.push("tenant_id = ?")
    parameters.push(params.tenantId)
  }

  if (params.userId) {
    where.push("user_id = ?")
    parameters.push(params.userId)
  }

  if (params.action) {
    where.push("action = ?")
    parameters.push(params.action)
  }

  if (params.traceId) {
    where.push("trace_id = ?")
    parameters.push(params.traceId)
  }

  where.push("created_at >= ?", "created_at <= ?")
  parameters.push(params.fromTs, params.toTs)

  return {
    ok: true,
    status: 200,
    value: {
      table: auditTables.logs,
      where,
      orderBy: ["created_at DESC", "id DESC"],
      limit: params.limit ?? auditQueryDefaultLimit,
      parameters,
    },
  }
}

function validateAuditLogInput(
  input: AuditLogInput,
): AuditModelValidationError[] {
  if (!Number.isInteger(input.latencyMs) || input.latencyMs < 0) {
    return [
      {
        status: 400,
        code: auditModelErrorCodes.INVALID_LATENCY,
        message: "Audit log latencyMs must be a non-negative integer.",
        details: {
          latencyMs: input.latencyMs,
        },
      },
    ]
  }

  return []
}

function validateAuditQueryParams(
  params: AuditQueryParams,
): AuditModelValidationError[] {
  const errors: AuditModelValidationError[] = []
  const limit = params.limit ?? auditQueryDefaultLimit

  if (params.fromTs > params.toTs) {
    errors.push({
      status: 400,
      code: auditModelErrorCodes.INVALID_TIME_WINDOW,
      message: "Audit query fromTs must be earlier than or equal to toTs.",
      details: {
        fromTs: params.fromTs,
        toTs: params.toTs,
      },
    })
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > auditQueryMaxLimit) {
    errors.push({
      status: 400,
      code: auditModelErrorCodes.INVALID_LIMIT,
      message: "Audit query limit must be an integer from 1 to 200.",
      details: {
        limit,
        maxLimit: auditQueryMaxLimit,
      },
    })
  }

  return errors
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
