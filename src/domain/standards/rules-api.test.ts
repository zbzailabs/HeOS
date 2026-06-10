import { describe, expect, it } from "vitest"

import {
  auditActions,
  auditEventTypes,
  auditResults,
} from "../audit/log"
import {
  alertLevels,
  alertTypes,
  metricCodes,
} from "../standards/enums"
import {
  alertModelErrorCodes,
  createStandardRule,
} from "../alerts/model"
import {
  createStandardRuleApiResult,
  patchStandardRuleApiResult,
  validateStandardRuleApiResult,
  standardRuleApiErrorCodes,
  type CreateStandardRuleRequest,
} from "./rules-api"

const createRequest = {
  traceId: "trace-rule-001",
  actorUserId: "user-1",
  latencyMs: 12,
  rule: {
    tenantId: "tenant-1",
    ruleCode: "soil-ph-high",
    name: "土壤 pH 偏高",
    ruleType: alertTypes.THRESHOLD,
    metricCode: metricCodes.SOIL_PH,
    level: alertLevels.WARNING,
    upper: 7.5,
    action: "安排农艺人员复核酸碱度并调整水肥方案。",
    version: "v0.1",
    effectiveFrom: "2026-06-10T00:00:00.000Z",
    createdBy: "admin",
  },
} as const satisfies CreateStandardRuleRequest

describe("standard rule management API contract", () => {
  it("creates a rule write plan with policy-change audit", () => {
    const result = createStandardRuleApiResult(createRequest)

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        method: "POST",
        path: "/api/standards/rules",
        rulePlan: {
          table: "heos_standard_rules",
          operation: "insert",
        },
        auditPlan: {
          table: "heos_audit_logs",
          record: {
            traceId: "trace-rule-001",
            userId: "user-1",
            eventType: auditEventTypes.POLICY_CHANGE,
            action: auditActions.POLICY_CHANGE,
            targetType: "standard_rule",
            result: auditResults.SUCCESS,
          },
        },
      },
    })
  })

  it("rejects create requests without a version", () => {
    const result = createStandardRuleApiResult({
      ...createRequest,
      rule: {
        ...createRequest.rule,
        version: "",
      },
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: standardRuleApiErrorCodes.MISSING_VERSION,
        },
      ],
    })
  })

  it("returns validation errors without creating a write plan", () => {
    const result = validateStandardRuleApiResult({
      ...createRequest.rule,
      lower: undefined,
      upper: undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: alertModelErrorCodes.INVALID_THRESHOLD_RANGE,
        },
      ],
    })
  })

  it("patches a rule and writes policy-change audit", () => {
    const currentRuleResult = createStandardRule(createRequest.rule)

    if (!currentRuleResult.ok) {
      throw new Error("invalid test rule")
    }

    const result = patchStandardRuleApiResult({
      traceId: "trace-rule-002",
      actorUserId: "user-1",
      latencyMs: 18,
      currentRule: currentRuleResult.value,
      patch: {
        upper: 7.8,
        action: "复核水肥策略并记录处置结果。",
      },
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        method: "PATCH",
        path: `/api/standards/rules/${currentRuleResult.value.id}`,
        rulePlan: {
          operation: "update",
          record: {
            id: currentRuleResult.value.id,
            upper: 7.8,
            threshold: 7.8,
          },
        },
        auditPlan: {
          record: {
            traceId: "trace-rule-002",
            targetId: currentRuleResult.value.id,
            result: auditResults.SUCCESS,
          },
        },
      },
    })
  })
})
