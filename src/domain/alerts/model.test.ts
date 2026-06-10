import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  alertLevels,
  alertTypes,
  metricCodes,
} from "../standards/enums"
import {
  alertModelErrorCodes,
  alertTables,
  createAlertPlan,
  createAlertRecord,
  createCurrentAlertKey,
  createStandardRule,
  ruleStatuses,
  type AlertTriggerInput,
  type StandardRuleInput,
} from "./model"

const migrationSql = readFileSync(
  new URL("../../../db/migrations/0005_heos_alert_rules.sql", import.meta.url),
  "utf8",
)

const thresholdRuleInput = {
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
} as const satisfies StandardRuleInput

const offlineRuleInput = {
  tenantId: "tenant-1",
  ruleCode: "device-offline-300s",
  name: "设备 5 分钟未上报",
  ruleType: alertTypes.OFFLINE,
  level: alertLevels.CRITICAL,
  offlineAfterSeconds: 300,
  action: "检查设备供电、通信信号和供应商同步状态。",
  version: "v0.1",
  effectiveFrom: "2026-06-10T00:00:00.000Z",
  createdBy: "admin",
} as const satisfies StandardRuleInput

function standardRule(input: StandardRuleInput = thresholdRuleInput) {
  const result = createStandardRule(input)

  if (!result.ok) {
    throw new Error("invalid test rule")
  }

  return result.value
}

function trigger(
  input: Partial<AlertTriggerInput> = {},
): AlertTriggerInput {
  return {
    tenantId: "tenant-1",
    siteId: "site-1",
    deviceId: "rk-sensor-001",
    observedAt: "2026-06-10T08:00:00.000Z",
    valueObserved: 7.9,
    ...input,
  }
}

describe("standard alert rules", () => {
  it("normalizes an active threshold rule with a stable identity", () => {
    const rule = standardRule()
    const duplicateVersion = standardRule({ ...thresholdRuleInput })
    const nextVersion = standardRule({
      ...thresholdRuleInput,
      version: "v0.2",
    })

    expect(rule).toMatchObject({
      table: alertTables.rules,
      tenantId: "tenant-1",
      ruleType: alertTypes.THRESHOLD,
      metricCode: metricCodes.SOIL_PH,
      status: ruleStatuses.ACTIVE,
      upper: 7.5,
      threshold: 7.5,
    })
    expect(rule.id).toBe(duplicateVersion.id)
    expect(rule.id).not.toBe(nextVersion.id)
  })

  it("rejects threshold rules without lower or upper bounds", () => {
    const result = createStandardRule({
      ...thresholdRuleInput,
      lower: undefined,
      upper: undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: alertModelErrorCodes.INVALID_THRESHOLD_RANGE,
          details: {
            ruleType: alertTypes.THRESHOLD,
          },
        },
      ],
    })
  })

  it("rejects an invalid effective window", () => {
    const result = createStandardRule({
      ...thresholdRuleInput,
      effectiveFrom: "2026-06-11T00:00:00.000Z",
      effectiveTo: "2026-06-10T00:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: alertModelErrorCodes.INVALID_EFFECTIVE_WINDOW,
        },
      ],
    })
  })
})

describe("alert generation", () => {
  it("creates a system-rule alert when a threshold rule is triggered", () => {
    const rule = standardRule()
    const result = createAlertPlan(rule, trigger())

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        table: alertTables.alerts,
        conflictKey: [
          "tenant_id",
          "site_id",
          "device_id",
          "alert_type",
          "metric_code",
          "rule_id",
        ],
        onDuplicateOpen: "keep_current",
        record: {
          tenantId: "tenant-1",
          alertType: alertTypes.THRESHOLD,
          level: alertLevels.WARNING,
          metricCode: metricCodes.SOIL_PH,
          threshold: 7.5,
          valueObserved: 7.9,
          createdBy: "system-rule",
          status: "open",
        },
      },
    })
  })

  it("allows offline and threshold alerts to exist for the same device", () => {
    const thresholdAlert = createAlertRecord(standardRule(), trigger())
    const offlineAlert = createAlertRecord(
      standardRule(offlineRuleInput),
      trigger({
        valueObserved: null,
        observedAt: "2026-06-10T08:05:00.000Z",
      }),
    )

    expect(thresholdAlert.alertType).toBe(alertTypes.THRESHOLD)
    expect(offlineAlert.alertType).toBe(alertTypes.OFFLINE)
    expect(createCurrentAlertKey(thresholdAlert)).not.toBe(
      createCurrentAlertKey(offlineAlert),
    )
  })

  it("keeps the same current-alert key for repeated open alerts", () => {
    const rule = standardRule()
    const first = createAlertRecord(rule, trigger({ valueObserved: 7.9 }))
    const repeated = createAlertRecord(rule, trigger({ valueObserved: 8.1 }))

    expect(createCurrentAlertKey(first)).toBe(createCurrentAlertKey(repeated))
  })
})

describe("alert D1 migration", () => {
  it("creates StandardRule and Alert tables with current alert indexes", () => {
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS heos_standard_rules")
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS heos_alerts")
    expect(migrationSql).toContain("created_by TEXT NOT NULL CHECK")
    expect(migrationSql).toContain("'system-rule'")
    expect(migrationSql).toContain("idx_heos_alerts_current_key")
  })
})
