import {
  type MetricCode,
  type TelemetryQuality,
  metricCodes,
  metricDefinitions,
  telemetryQualities,
} from "../standards/enums"

export const telemetryTables = {
  latest: "heos_telemetry_latest",
  history: "heos_telemetry_history",
} as const

export const telemetryHistoryDefaultLimit = 50
export const telemetryHistoryMaxLimit = 200

export type TelemetrySource = "renke" | "manual" | "simulation"
export type TelemetryHistoryOrder = "asc" | "desc"

export type TelemetrySampleInput = {
  tenantId: string
  siteId: string
  deviceId: string
  metricCode: MetricCode
  value: number
  unit?: string
  quality?: TelemetryQuality
  source: TelemetrySource
  sourceSampleId?: string
  rawPayloadHash?: string
  observedAt: string
  ingestedAt?: string
}

export type TelemetrySample = Required<
  Omit<TelemetrySampleInput, "sourceSampleId" | "rawPayloadHash" | "ingestedAt">
> & {
  sourceSampleId: string | null
  rawPayloadHash: string | null
  ingestedAt: string
}

export type TelemetryLatestRecord = TelemetrySample & {
  id: string
}

export type TelemetryHistoryRecord = TelemetrySample & {
  id: string
  sampleKey: string
}

export type TelemetryWritePlan = {
  latest: {
    table: typeof telemetryTables.latest
    conflictTarget: readonly [
      "tenant_id",
      "site_id",
      "device_id",
      "metric_code",
    ]
    updateCondition: string
    record: TelemetryLatestRecord
  }
  history: {
    table: typeof telemetryTables.history
    conflictTarget: "sample_key"
    onConflict: "do_nothing"
    record: TelemetryHistoryRecord
  }
}

export type TelemetryHistoryCursor = {
  observedAt: string
  id: string
}

export type TelemetryHistoryQueryParams = {
  tenantId: string
  siteId: string
  deviceId: string
  metricCode: MetricCode
  fromTs: string
  toTs: string
  order?: TelemetryHistoryOrder
  limit?: number
  cursor?: TelemetryHistoryCursor
}

export type TelemetryHistoryQueryPlan = {
  table: typeof telemetryTables.history
  where: readonly string[]
  orderBy: readonly string[]
  limit: number
  parameters: readonly (number | string)[]
}

export const telemetryModelErrorCodes = {
  INVALID_TIME_WINDOW: "TELEMETRY_INVALID_TIME_WINDOW",
  INVALID_LIMIT: "TELEMETRY_INVALID_LIMIT",
  INVALID_METRIC_UNIT: "TELEMETRY_INVALID_METRIC_UNIT",
} as const

export type TelemetryModelValidationError = {
  status: 400
  code: (typeof telemetryModelErrorCodes)[keyof typeof telemetryModelErrorCodes]
  message: string
  details: Record<string, number | string | string[]>
}

export type TelemetryModelResult<T> =
  | {
      ok: true
      status: 200
      value: T
    }
  | {
      ok: false
      status: 400
      errors: TelemetryModelValidationError[]
    }

export function normalizeTelemetrySample(
  input: TelemetrySampleInput,
): TelemetryModelResult<TelemetrySample> {
  const defaultUnit = metricDefinitions[input.metricCode].defaultUnit
  const unit = input.unit ?? defaultUnit

  if (unit !== defaultUnit) {
    return {
      ok: false,
      status: 400,
      errors: [
        {
          status: 400,
          code: telemetryModelErrorCodes.INVALID_METRIC_UNIT,
          message: "Telemetry sample unit must match the metric default unit.",
          details: {
            metricCode: input.metricCode,
            expectedUnit: defaultUnit,
            actualUnit: unit,
          },
        },
      ],
    }
  }

  return {
    ok: true,
    status: 200,
    value: {
      tenantId: input.tenantId,
      siteId: input.siteId,
      deviceId: input.deviceId,
      metricCode: input.metricCode,
      value: input.value,
      unit,
      quality: input.quality ?? telemetryQualities.GOOD,
      source: input.source,
      sourceSampleId: input.sourceSampleId ?? null,
      rawPayloadHash: input.rawPayloadHash ?? null,
      observedAt: input.observedAt,
      ingestedAt: input.ingestedAt ?? input.observedAt,
    },
  }
}

export function createTelemetryLatestId(sample: TelemetrySample) {
  return createStableKey([
    "latest",
    sample.tenantId,
    sample.siteId,
    sample.deviceId,
    sample.metricCode,
  ])
}

export function createTelemetrySampleKey(sample: TelemetrySample) {
  return createStableKey([
    sample.tenantId,
    sample.siteId,
    sample.deviceId,
    sample.metricCode,
    sample.source,
    sample.observedAt,
  ])
}

export function createTelemetryHistoryId(sample: TelemetrySample) {
  return createStableKey(["history", createTelemetrySampleKey(sample)])
}

export function createTelemetryLatestRecord(
  sample: TelemetrySample,
): TelemetryLatestRecord {
  return {
    ...sample,
    id: createTelemetryLatestId(sample),
  }
}

export function createTelemetryHistoryRecord(
  sample: TelemetrySample,
): TelemetryHistoryRecord {
  const sampleKey = createTelemetrySampleKey(sample)

  return {
    ...sample,
    id: createStableKey(["history", sampleKey]),
    sampleKey,
  }
}

export function createTelemetryWritePlan(
  sample: TelemetrySample,
): TelemetryWritePlan {
  return {
    latest: {
      table: telemetryTables.latest,
      conflictTarget: ["tenant_id", "site_id", "device_id", "metric_code"],
      updateCondition:
        "excluded.observed_at >= heos_telemetry_latest.observed_at",
      record: createTelemetryLatestRecord(sample),
    },
    history: {
      table: telemetryTables.history,
      conflictTarget: "sample_key",
      onConflict: "do_nothing",
      record: createTelemetryHistoryRecord(sample),
    },
  }
}

export function resolveTelemetryLatestRecord(
  current: TelemetryLatestRecord | null,
  incoming: TelemetryLatestRecord,
) {
  if (!current) {
    return incoming
  }

  return incoming.observedAt >= current.observedAt ? incoming : current
}

export function createTelemetryHistoryQueryPlan(
  params: TelemetryHistoryQueryParams,
): TelemetryModelResult<TelemetryHistoryQueryPlan> {
  const validation = validateTelemetryHistoryQueryParams(params)

  if (!validation.ok) {
    return validation
  }

  const order = params.order ?? "desc"
  const limit = params.limit ?? telemetryHistoryDefaultLimit
  const where = [
    "tenant_id = ?",
    "site_id = ?",
    "device_id = ?",
    "metric_code = ?",
    "observed_at >= ?",
    "observed_at <= ?",
  ]
  const parameters: (number | string)[] = [
    params.tenantId,
    params.siteId,
    params.deviceId,
    params.metricCode,
    params.fromTs,
    params.toTs,
  ]

  if (params.cursor) {
    where.push(
      order === "asc"
        ? "(observed_at > ? OR (observed_at = ? AND id > ?))"
        : "(observed_at < ? OR (observed_at = ? AND id < ?))",
    )
    parameters.push(
      params.cursor.observedAt,
      params.cursor.observedAt,
      params.cursor.id,
    )
  }

  return {
    ok: true,
    status: 200,
    value: {
      table: telemetryTables.history,
      where,
      orderBy:
        order === "asc"
          ? ["observed_at ASC", "id ASC"]
          : ["observed_at DESC", "id DESC"],
      limit,
      parameters,
    },
  }
}

export function getTelemetryHistoryPage(
  records: readonly TelemetryHistoryRecord[],
  params: TelemetryHistoryQueryParams,
): TelemetryModelResult<{
  items: TelemetryHistoryRecord[]
  nextCursor: TelemetryHistoryCursor | null
}> {
  const queryPlan = createTelemetryHistoryQueryPlan(params)

  if (!queryPlan.ok) {
    return queryPlan
  }

  const order = params.order ?? "desc"
  const filtered = records
    .filter((record) => matchesHistoryQuery(record, params))
    .filter((record) => matchesCursor(record, params.cursor, order))
    .sort((left, right) => compareHistoryRecords(left, right, order))
    .slice(0, queryPlan.value.limit)
  const lastItem = filtered.at(-1)

  return {
    ok: true,
    status: 200,
    value: {
      items: filtered,
      nextCursor: lastItem
        ? {
            observedAt: lastItem.observedAt,
            id: lastItem.id,
          }
        : null,
    },
  }
}

export function getTelemetryMetricCodes() {
  return Object.values(metricCodes)
}

function validateTelemetryHistoryQueryParams(
  params: TelemetryHistoryQueryParams,
): TelemetryModelResult<true> {
  const errors: TelemetryModelValidationError[] = []
  const limit = params.limit ?? telemetryHistoryDefaultLimit

  if (params.fromTs > params.toTs) {
    errors.push({
      status: 400,
      code: telemetryModelErrorCodes.INVALID_TIME_WINDOW,
      message: "Telemetry history fromTs must be earlier than or equal to toTs.",
      details: {
        fromTs: params.fromTs,
        toTs: params.toTs,
      },
    })
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > telemetryHistoryMaxLimit) {
    errors.push({
      status: 400,
      code: telemetryModelErrorCodes.INVALID_LIMIT,
      message: "Telemetry history limit must be an integer from 1 to 200.",
      details: {
        limit,
        maxLimit: telemetryHistoryMaxLimit,
      },
    })
  }

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
    value: true,
  }
}

function matchesHistoryQuery(
  record: TelemetryHistoryRecord,
  params: TelemetryHistoryQueryParams,
) {
  return (
    record.tenantId === params.tenantId &&
    record.siteId === params.siteId &&
    record.deviceId === params.deviceId &&
    record.metricCode === params.metricCode &&
    record.observedAt >= params.fromTs &&
    record.observedAt <= params.toTs
  )
}

function matchesCursor(
  record: TelemetryHistoryRecord,
  cursor: TelemetryHistoryCursor | undefined,
  order: TelemetryHistoryOrder,
) {
  if (!cursor) {
    return true
  }

  if (order === "asc") {
    return (
      record.observedAt > cursor.observedAt ||
      (record.observedAt === cursor.observedAt && record.id > cursor.id)
    )
  }

  return (
    record.observedAt < cursor.observedAt ||
    (record.observedAt === cursor.observedAt && record.id < cursor.id)
  )
}

function compareHistoryRecords(
  left: TelemetryHistoryRecord,
  right: TelemetryHistoryRecord,
  order: TelemetryHistoryOrder,
) {
  const observedAtComparison = left.observedAt.localeCompare(right.observedAt)
  const idComparison = left.id.localeCompare(right.id)
  const comparison = observedAtComparison || idComparison

  return order === "asc" ? comparison : -comparison
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
