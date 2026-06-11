import { metricCodes, type MetricCode } from "../standards/enums"
import {
  createTelemetryHistoryRecord,
  createTelemetryLatestRecord,
  getTelemetryHistoryPage,
  normalizeTelemetrySample,
  telemetryHistoryMaxLimit,
  type TelemetryHistoryQueryParams,
  type TelemetryLatestRecord,
} from "./model"

export const telemetryApiErrorCodes = {
  MISSING_PARAM: "TELEMETRY_MISSING_PARAM",
  INVALID_PARAM: "TELEMETRY_INVALID_PARAM",
  INVALID_TIME_WINDOW: "TELEMETRY_INVALID_TIME_WINDOW",
  TIME_WINDOW_TOO_LARGE: "TELEMETRY_TIME_WINDOW_TOO_LARGE",
} as const

export type TelemetryApiErrorCode =
  (typeof telemetryApiErrorCodes)[keyof typeof telemetryApiErrorCodes]

export type TelemetryApiError = {
  status: 400
  code: TelemetryApiErrorCode
  message: string
  details: Record<string, number | string | string[]>
  traceId: string
}

export type TelemetryApiResult<T> =
  | {
      ok: true
      status: 200
      traceId: string
      value: T
    }
  | {
      ok: false
      status: 400
      traceId: string
      errors: TelemetryApiError[]
    }

export const telemetryHistoryMaxWindowMs = 7 * 24 * 60 * 60 * 1000

export function createTraceId(prefix = "trace") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function parseTelemetryLatestQuery(
  params: URLSearchParams,
  traceId = createTraceId(),
): TelemetryApiResult<{
  tenantId: string
  deviceId: string
  metricCode: MetricCode
}> {
  const errors = collectRequiredTelemetryErrors(params, traceId)
  const metricCode = params.get("metricCode")

  if (metricCode && !isMetricCode(metricCode)) {
    errors.push({
      status: 400,
      code: telemetryApiErrorCodes.INVALID_PARAM,
      message: "metricCode must use the standard metric enum.",
      details: {
        metricCode,
        allowed: Object.values(metricCodes),
      },
      traceId,
    })
  }

  if (errors.length > 0) {
    return { ok: false, status: 400, traceId, errors }
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: {
      tenantId: String(params.get("tenantId")),
      deviceId: String(params.get("deviceId")),
      metricCode: metricCode as MetricCode,
    },
  }
}

export function parseTelemetryHistoryQuery(
  params: URLSearchParams,
  traceId = createTraceId(),
): TelemetryApiResult<TelemetryHistoryQueryParams> {
  const latest = parseTelemetryLatestQuery(params, traceId)
  const errors = latest.ok ? [] : [...latest.errors]
  const siteId = params.get("siteId") ?? "site-tenglong-smart-farm"
  const fromTs = params.get("fromTs")
  const toTs = params.get("toTs")

  if (!fromTs) {
    errors.push(createMissingParamError("fromTs", traceId))
  }

  if (!toTs) {
    errors.push(createMissingParamError("toTs", traceId))
  }

  if (fromTs && toTs) {
    const fromTime = Date.parse(fromTs)
    const toTime = Date.parse(toTs)

    if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) {
      errors.push({
        status: 400,
        code: telemetryApiErrorCodes.INVALID_PARAM,
        message: "fromTs and toTs must be ISO 8601 timestamps.",
        details: { fromTs, toTs },
        traceId,
      })
    } else {
      if (fromTime > toTime) {
        errors.push({
          status: 400,
          code: telemetryApiErrorCodes.INVALID_TIME_WINDOW,
          message: "fromTs must be earlier than or equal to toTs.",
          details: { fromTs, toTs },
          traceId,
        })
      }

      if (toTime - fromTime > telemetryHistoryMaxWindowMs) {
        errors.push({
          status: 400,
          code: telemetryApiErrorCodes.TIME_WINDOW_TOO_LARGE,
          message: "Telemetry history query window cannot exceed 7 days.",
          details: {
            fromTs,
            toTs,
            maxWindowHours: 168,
          },
          traceId,
        })
      }
    }
  }

  const limitParam = params.get("limit")
  const limit = limitParam ? Number(limitParam) : undefined
  const cursorObservedAt = params.get("cursorObservedAt")
  const cursorId = params.get("cursorId")

  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1 || limit > telemetryHistoryMaxLimit)
  ) {
    errors.push({
      status: 400,
      code: telemetryApiErrorCodes.INVALID_PARAM,
      message: "limit must be an integer from 1 to 200.",
      details: { limit: limitParam ?? "", maxLimit: telemetryHistoryMaxLimit },
      traceId,
    })
  }

  if (errors.length > 0 || !latest.ok || !fromTs || !toTs) {
    return { ok: false, status: 400, traceId, errors }
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: {
      ...latest.value,
      siteId,
      fromTs,
      toTs,
      order: params.get("order") === "asc" ? "asc" : "desc",
      limit,
      cursor:
        cursorObservedAt && cursorId
          ? {
              observedAt: cursorObservedAt,
              id: cursorId,
            }
          : undefined,
    },
  }
}

export function getDemoTelemetryLatest(
  query: {
    tenantId: string
    deviceId: string
    metricCode: MetricCode
  },
  traceId = createTraceId(),
): TelemetryApiResult<TelemetryLatestRecord> {
  const sample = normalizeTelemetrySample({
    tenantId: query.tenantId,
    siteId: "site-tenglong-smart-farm",
    deviceId: query.deviceId,
    metricCode: query.metricCode,
    value: query.metricCode === metricCodes.SOIL_PH ? 6.7 : 26.4,
    source: "renke",
    observedAt: "2026-06-10T08:00:00.000Z",
  })

  if (!sample.ok) {
    return {
      ok: false,
      status: 400,
      traceId,
      errors: sample.errors.map((error) => ({
        ...error,
        code: telemetryApiErrorCodes.INVALID_PARAM,
        traceId,
      })),
    }
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: createTelemetryLatestRecord(sample.value),
  }
}

export function getDemoTelemetryHistory(
  query: TelemetryHistoryQueryParams,
  traceId = createTraceId(),
) {
  const records = [0, 1, 2].map((offset) => {
    const observedAt = new Date(Date.parse(query.fromTs) + offset * 60 * 60_000)
      .toISOString()
    const sample = normalizeTelemetrySample({
      tenantId: query.tenantId,
      siteId: query.siteId,
      deviceId: query.deviceId,
      metricCode: query.metricCode,
      value: query.metricCode === metricCodes.SOIL_PH ? 6.5 + offset * 0.1 : 24 + offset,
      source: "renke",
      observedAt,
    })

    if (!sample.ok) {
      throw new Error("Invalid demo telemetry history sample")
    }

    return createTelemetryHistoryRecord(sample.value)
  })

  const page = getTelemetryHistoryPage(records, query)

  if (!page.ok) {
    return {
      ok: false,
      status: 400,
      traceId,
      errors: page.errors.map((error) => ({
        ...error,
        code: telemetryApiErrorCodes.INVALID_PARAM,
        traceId,
      })),
    } satisfies TelemetryApiResult<never>
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: page.value,
  } satisfies TelemetryApiResult<typeof page.value>
}

function collectRequiredTelemetryErrors(
  params: URLSearchParams,
  traceId: string,
) {
  const errors: TelemetryApiError[] = []

  for (const name of ["tenantId", "deviceId", "metricCode"] as const) {
    if (!params.get(name)) {
      errors.push(createMissingParamError(name, traceId))
    }
  }

  return errors
}

function createMissingParamError(name: string, traceId: string): TelemetryApiError {
  return {
    status: 400,
    code: telemetryApiErrorCodes.MISSING_PARAM,
    message: `${name} is required.`,
    details: { param: name },
    traceId,
  }
}

function isMetricCode(value: string): value is MetricCode {
  return Object.values(metricCodes).includes(value as MetricCode)
}
