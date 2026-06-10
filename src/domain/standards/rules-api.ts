import {
  auditActions,
  auditEventTypes,
  auditResults,
  createAuditLogWritePlan,
  type AuditLogWritePlan,
} from "../audit/log"
import {
  alertTables,
  createStandardRule,
  type AlertModelValidationError,
  type StandardRule,
  type StandardRuleInput,
} from "../alerts/model"

export type CreateStandardRuleRequest = {
  traceId: string
  actorUserId: string
  latencyMs: number
  rule: StandardRuleInput
}

export type PatchStandardRuleRequest = {
  traceId: string
  actorUserId: string
  latencyMs: number
  currentRule: StandardRule
  patch: Partial<
    Pick<
      StandardRuleInput,
      "name" | "level" | "threshold" | "lower" | "upper" | "action" | "status" | "effectiveTo"
    >
  >
}

export type StandardRuleWritePlan = {
  table: typeof alertTables.rules
  operation: "insert" | "update"
  record: StandardRule
}

export type StandardRuleApiSuccess = {
  method: "POST" | "PATCH"
  path: string
  rulePlan: StandardRuleWritePlan
  auditPlan: AuditLogWritePlan
}

export const standardRuleApiErrorCodes = {
  MISSING_VERSION: "STANDARD_RULE_MISSING_VERSION",
} as const

export type StandardRuleApiValidationError =
  | AlertModelValidationError
  | {
      status: 400
      code: (typeof standardRuleApiErrorCodes)[keyof typeof standardRuleApiErrorCodes]
      message: string
      details: Record<string, string>
    }

export type StandardRuleApiResult<T> =
  | {
      ok: true
      status: 200
      value: T
    }
  | {
      ok: false
      status: 400
      errors: StandardRuleApiValidationError[]
    }

export function createStandardRuleApiResult(
  request: CreateStandardRuleRequest,
): StandardRuleApiResult<StandardRuleApiSuccess> {
  const versionError = validateRuleVersion(request.rule.version)

  if (versionError) {
    return versionError
  }

  const ruleResult = createStandardRule(request.rule)

  if (!ruleResult.ok) {
    return ruleResult
  }

  const auditPlan = createPolicyChangeAuditPlan({
    traceId: request.traceId,
    actorUserId: request.actorUserId,
    latencyMs: request.latencyMs,
    rule: ruleResult.value,
  })

  if (!auditPlan.ok) {
    return auditPlan
  }

  return {
    ok: true,
    status: 200,
    value: {
      method: "POST",
      path: "/api/standards/rules",
      rulePlan: {
        table: alertTables.rules,
        operation: "insert",
        record: ruleResult.value,
      },
      auditPlan: auditPlan.value,
    },
  }
}

export function patchStandardRuleApiResult(
  request: PatchStandardRuleRequest,
): StandardRuleApiResult<StandardRuleApiSuccess> {
  const versionError = validateRuleVersion(request.currentRule.version)

  if (versionError) {
    return versionError
  }

  const ruleResult = createStandardRule({
    tenantId: request.currentRule.tenantId,
    ruleCode: request.currentRule.ruleCode,
    name: request.patch.name ?? request.currentRule.name,
    ruleType: request.currentRule.ruleType,
    metricCode: request.currentRule.metricCode ?? undefined,
    level: request.patch.level ?? request.currentRule.level,
    threshold: request.patch.threshold ?? request.patch.upper ?? request.patch.lower ?? request.currentRule.threshold ?? undefined,
    lower: request.patch.lower ?? request.currentRule.lower ?? undefined,
    upper: request.patch.upper ?? request.currentRule.upper ?? undefined,
    action: request.patch.action ?? request.currentRule.action,
    version: request.currentRule.version,
    status: request.patch.status ?? request.currentRule.status,
    effectiveFrom: request.currentRule.effectiveFrom,
    effectiveTo: request.patch.effectiveTo ?? request.currentRule.effectiveTo ?? undefined,
    createdBy: request.currentRule.createdBy,
  })

  if (!ruleResult.ok) {
    return ruleResult
  }

  const record = {
    ...ruleResult.value,
    id: request.currentRule.id,
  }
  const auditPlan = createPolicyChangeAuditPlan({
    traceId: request.traceId,
    actorUserId: request.actorUserId,
    latencyMs: request.latencyMs,
    rule: record,
  })

  if (!auditPlan.ok) {
    return auditPlan
  }

  return {
    ok: true,
    status: 200,
    value: {
      method: "PATCH",
      path: `/api/standards/rules/${request.currentRule.id}`,
      rulePlan: {
        table: alertTables.rules,
        operation: "update",
        record,
      },
      auditPlan: auditPlan.value,
    },
  }
}

export function validateStandardRuleApiResult(
  rule: StandardRuleInput,
): StandardRuleApiResult<StandardRule> {
  const versionError = validateRuleVersion(rule.version)

  if (versionError) {
    return versionError
  }

  return createStandardRule(rule)
}

function validateRuleVersion(
  version: string,
): StandardRuleApiResult<never> | null {
  if (version.trim().length > 0) {
    return null
  }

  return {
    ok: false,
    status: 400,
    errors: [
      {
        status: 400,
        code: standardRuleApiErrorCodes.MISSING_VERSION,
        message: "Standard rule version is required.",
        details: {
          field: "version",
        },
      },
    ],
  }
}

function createPolicyChangeAuditPlan(input: {
  traceId: string
  actorUserId: string
  latencyMs: number
  rule: StandardRule
}) {
  return createAuditLogWritePlan({
    traceId: input.traceId,
    tenantId: input.rule.tenantId,
    userId: input.actorUserId,
    eventType: auditEventTypes.POLICY_CHANGE,
    action: auditActions.POLICY_CHANGE,
    targetType: "standard_rule",
    targetId: input.rule.id,
    targetName: input.rule.name,
    result: auditResults.SUCCESS,
    latencyMs: input.latencyMs,
    source: "standard-rule-api",
    metadataJson: JSON.stringify({
      ruleCode: input.rule.ruleCode,
      version: input.rule.version,
    }),
    createdAt: new Date(0).toISOString(),
  })
}
