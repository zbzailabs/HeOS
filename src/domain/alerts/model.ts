import {
  alertLevels,
  alertTypes,
  type AlertLevel,
  type AlertType,
  type MetricCode,
} from "../standards/enums"

export const alertTables = {
  rules: "heos_standard_rules",
  alerts: "heos_alerts",
} as const

export const ruleStatuses = {
  DRAFT: "draft",
  ACTIVE: "active",
  DISABLED: "disabled",
  DEPRECATED: "deprecated",
} as const

export type RuleStatus = (typeof ruleStatuses)[keyof typeof ruleStatuses]

export const alertStatuses = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const

export type AlertStatus = (typeof alertStatuses)[keyof typeof alertStatuses]

export type AlertCreatedBy = "system-rule" | "provider-sync" | "manual"

export type StandardRuleInput = {
  tenantId: string
  ruleCode: string
  name: string
  ruleType: AlertType
  metricCode?: MetricCode
  level: AlertLevel
  threshold?: number
  lower?: number
  upper?: number
  offlineAfterSeconds?: number
  action: string
  version: string
  status?: RuleStatus
  effectiveFrom: string
  effectiveTo?: string
  createdBy: string
}

export type StandardRule = Required<
  Omit<
    StandardRuleInput,
    "metricCode" | "threshold" | "lower" | "upper" | "offlineAfterSeconds" | "effectiveTo" | "status"
  >
> & {
  table: typeof alertTables.rules
  id: string
  metricCode: MetricCode | null
  threshold: number | null
  lower: number | null
  upper: number | null
  offlineAfterSeconds: number | null
  effectiveTo: string | null
  status: RuleStatus
}

export type AlertTriggerInput = {
  tenantId: string
  siteId: string
  deviceId: string
  observedAt: string
  valueObserved: number | null
}

export type AlertRecord = {
  id: string
  tenantId: string
  siteId: string
  deviceId: string
  ruleId: string
  alertType: AlertType
  level: AlertLevel
  metricCode: MetricCode | null
  threshold: number | null
  valueObserved: number | null
  reason: string
  suggestedAction: string
  status: AlertStatus
  createdBy: AlertCreatedBy
  triggeredAt: string
}

export type AlertPlan = {
  table: typeof alertTables.alerts
  conflictKey: readonly [
    "tenant_id",
    "site_id",
    "device_id",
    "alert_type",
    "metric_code",
    "rule_id",
  ]
  onDuplicateOpen: "keep_current"
  record: AlertRecord
}

export const alertModelErrorCodes = {
  INVALID_THRESHOLD_RANGE: "ALERT_INVALID_THRESHOLD_RANGE",
  INVALID_EFFECTIVE_WINDOW: "ALERT_INVALID_EFFECTIVE_WINDOW",
  INVALID_OFFLINE_WINDOW: "ALERT_INVALID_OFFLINE_WINDOW",
} as const

export type AlertModelValidationError = {
  status: 400
  code: (typeof alertModelErrorCodes)[keyof typeof alertModelErrorCodes]
  message: string
  details: Record<string, number | string | null>
}

export type AlertModelResult<T> =
  | {
      ok: true
      status: 200
      value: T
    }
  | {
      ok: false
      status: 400
      errors: AlertModelValidationError[]
    }

export function createStandardRule(
  input: StandardRuleInput,
): AlertModelResult<StandardRule> {
  const errors = validateStandardRule(input)

  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    }
  }

  const threshold = input.threshold ?? input.upper ?? input.lower ?? null

  return {
    ok: true,
    status: 200,
    value: {
      table: alertTables.rules,
      id: createStableKey([
        "rule",
        input.tenantId,
        input.ruleCode,
        input.version,
      ]),
      tenantId: input.tenantId,
      ruleCode: input.ruleCode,
      name: input.name,
      ruleType: input.ruleType,
      metricCode: input.metricCode ?? null,
      level: input.level,
      threshold,
      lower: input.lower ?? null,
      upper: input.upper ?? null,
      offlineAfterSeconds:
        input.ruleType === alertTypes.OFFLINE
          ? (input.offlineAfterSeconds ?? 300)
          : null,
      action: input.action,
      version: input.version,
      status: input.status ?? ruleStatuses.ACTIVE,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
      createdBy: input.createdBy,
    },
  }
}

export function createAlertPlan(
  rule: StandardRule,
  trigger: AlertTriggerInput,
): AlertModelResult<AlertPlan> {
  return {
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
      record: createAlertRecord(rule, trigger),
    },
  }
}

export function createAlertRecord(
  rule: StandardRule,
  trigger: AlertTriggerInput,
): AlertRecord {
  const recordBase = [
    "alert",
    trigger.tenantId,
    trigger.siteId,
    trigger.deviceId,
    rule.ruleType,
    rule.metricCode ?? "none",
    rule.id,
    trigger.observedAt,
  ]

  return {
    id: createStableKey(recordBase),
    tenantId: trigger.tenantId,
    siteId: trigger.siteId,
    deviceId: trigger.deviceId,
    ruleId: rule.id,
    alertType: rule.ruleType,
    level: rule.level,
    metricCode: rule.metricCode,
    threshold: rule.threshold,
    valueObserved: trigger.valueObserved,
    reason: createAlertReason(rule, trigger),
    suggestedAction: rule.action,
    status: alertStatuses.OPEN,
    createdBy: "system-rule",
    triggeredAt: trigger.observedAt,
  }
}

export function createCurrentAlertKey(alert: AlertRecord) {
  return createStableKey([
    alert.tenantId,
    alert.siteId,
    alert.deviceId,
    alert.alertType,
    alert.metricCode ?? "none",
    alert.ruleId,
  ])
}

function validateStandardRule(
  input: StandardRuleInput,
): AlertModelValidationError[] {
  const errors: AlertModelValidationError[] = []

  if (
    input.ruleType === alertTypes.THRESHOLD &&
    input.lower === undefined &&
    input.upper === undefined
  ) {
    errors.push({
      status: 400,
      code: alertModelErrorCodes.INVALID_THRESHOLD_RANGE,
      message: "Threshold rules require at least one lower or upper bound.",
      details: {
        ruleType: input.ruleType,
        lower: input.lower ?? null,
        upper: input.upper ?? null,
      },
    })
  }

  if (input.effectiveTo && input.effectiveFrom > input.effectiveTo) {
    errors.push({
      status: 400,
      code: alertModelErrorCodes.INVALID_EFFECTIVE_WINDOW,
      message: "Rule effectiveFrom must be earlier than or equal to effectiveTo.",
      details: {
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
      },
    })
  }

  const offlineAfterSeconds = input.offlineAfterSeconds ?? 300

  if (
    input.ruleType === alertTypes.OFFLINE &&
    (!Number.isInteger(offlineAfterSeconds) || offlineAfterSeconds < 1)
  ) {
    errors.push({
      status: 400,
      code: alertModelErrorCodes.INVALID_OFFLINE_WINDOW,
      message: "Offline rules require a positive integer offline window.",
      details: {
        offlineAfterSeconds,
      },
    })
  }

  return errors
}

function createAlertReason(rule: StandardRule, trigger: AlertTriggerInput) {
  if (rule.ruleType === alertTypes.OFFLINE) {
    return `Device did not report within ${rule.offlineAfterSeconds ?? 300} seconds.`
  }

  if (rule.ruleType === alertTypes.THRESHOLD) {
    return `Metric ${rule.metricCode} observed ${trigger.valueObserved} outside configured threshold.`
  }

  return `Alert rule ${rule.ruleCode} was triggered.`
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
