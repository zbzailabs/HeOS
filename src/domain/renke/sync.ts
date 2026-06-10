import {
  metricCodes,
  syncStatuses,
  telemetryQualities,
  type MetricCode,
  type SyncStatus,
} from "../standards/enums"
import {
  normalizeTelemetrySample,
  type TelemetrySample,
  type TelemetrySource,
} from "../telemetry/model"

export const renkeProviderId = "renke"
export const renkeDefaultBaseUrl = "http://api.farm.0531yun.cn"
export const renkeTenantId = "tenant-tenglong-school"
export const renkeSiteId = "site-tenglong-smart-farm"
export const renkeDeviceAddr = "40406816"

export const renkeSyncErrorCodes = {
  AUTH_TIMEOUT: syncStatuses.AUTH_TIMEOUT,
  SOURCE_TIMEOUT: syncStatuses.SOURCE_TIMEOUT,
  SCHEMA_MISMATCH: syncStatuses.SCHEMA_MISMATCH,
} as const

export type RenkeSyncErrorCode =
  (typeof renkeSyncErrorCodes)[keyof typeof renkeSyncErrorCodes]

export type RenkeRealtimeDataPoint = {
  name?: string
  factorName?: string
  nodeName?: string
  key?: string
  factorId?: string | number
  nodeId?: string | number
  value?: string | number
  valueText?: string | number
  unit?: string
  alarmStatus?: string | number | boolean
  alarming?: string | number | boolean
}

export type RenkeRealtimeDevice = {
  deviceAddr?: string
  deviceName?: string
  deviceType?: string
  status?: string
  data?: RenkeRealtimeDataPoint[] | Record<string, unknown>
}

export type RenkeSyncFailure = {
  code: RenkeSyncErrorCode
  message: string
  deviceAddr?: string
  raw?: unknown
}

export type RenkeSyncSummary = {
  total: number
  updated: number
  failed: number
  ts: string
  status: SyncStatus
  samples: TelemetrySample[]
  failures: RenkeSyncFailure[]
}

const renkeMetricMappings: readonly {
  patterns: readonly string[]
  metricCode: MetricCode
  unit: string
}[] = [
  {
    patterns: ["空气温度", "气温", "air_temperature", "temperature"],
    metricCode: metricCodes.AIR_TEMPERATURE,
    unit: "celsius",
  },
  {
    patterns: ["土壤温度", "soil_temperature"],
    metricCode: metricCodes.SOIL_TEMPERATURE,
    unit: "celsius",
  },
  {
    patterns: ["土壤湿度", "土壤水分", "墒情", "soil_moisture"],
    metricCode: metricCodes.SOIL_MOISTURE,
    unit: "percent",
  },
  {
    patterns: ["空气湿度", "湿度", "air_humidity"],
    metricCode: metricCodes.AIR_HUMIDITY,
    unit: "percent",
  },
  {
    patterns: ["光照", "照度", "illuminance"],
    metricCode: metricCodes.ILLUMINANCE,
    unit: "lux",
  },
  {
    patterns: ["二氧化碳", "co2"],
    metricCode: metricCodes.CO2,
    unit: "ppm",
  },
  {
    patterns: ["电导率", "ec", "soil_ec"],
    metricCode: metricCodes.SOIL_EC,
    unit: "us_cm",
  },
  {
    patterns: ["ph", "酸碱度", "soil_ph"],
    metricCode: metricCodes.SOIL_PH,
    unit: "ph",
  },
  {
    patterns: ["电量", "电池", "battery"],
    metricCode: metricCodes.BATTERY_VOLTAGE,
    unit: "volt",
  },
  {
    patterns: ["信号", "signal"],
    metricCode: metricCodes.SIGNAL_STRENGTH,
    unit: "dbm",
  },
]

export function createRenkeSyncSummary(input: {
  devices: readonly RenkeRealtimeDevice[]
  tenantId?: string
  siteId?: string
  source?: TelemetrySource
  now?: string
}): RenkeSyncSummary {
  const samples: TelemetrySample[] = []
  const failures: RenkeSyncFailure[] = []
  const now = input.now ?? new Date().toISOString()

  for (const device of input.devices) {
    const deviceAddr = device.deviceAddr

    if (!deviceAddr || !Array.isArray(device.data)) {
      failures.push({
        code: renkeSyncErrorCodes.SCHEMA_MISMATCH,
        message: "Renke realtime payload is missing deviceAddr or data array.",
        deviceAddr,
        raw: device,
      })
      continue
    }

    for (const point of device.data) {
      const metric = resolveRenkeMetric(point)
      const value = Number(point.value ?? point.valueText)

      if (!metric || !Number.isFinite(value)) {
        failures.push({
          code: renkeSyncErrorCodes.SCHEMA_MISMATCH,
          message: "Renke datapoint cannot be mapped to a telemetry metric.",
          deviceAddr,
          raw: point,
        })
        continue
      }

      const normalized = normalizeTelemetrySample({
        tenantId: input.tenantId ?? renkeTenantId,
        siteId: input.siteId ?? renkeSiteId,
        deviceId: deviceAddr,
        metricCode: metric.metricCode,
        value,
        unit: metric.unit,
        quality: isRenkePointAlarming(point)
          ? telemetryQualities.SUSPECT
          : telemetryQualities.GOOD,
        source: input.source ?? renkeProviderId,
        sourceSampleId: String(point.factorId ?? point.nodeId ?? metric.metricCode),
        rawPayloadHash: createRenkePayloadHash(point),
        observedAt: now,
        ingestedAt: now,
      })

      if (normalized.ok) {
        samples.push(normalized.value)
      } else {
        failures.push({
          code: renkeSyncErrorCodes.SCHEMA_MISMATCH,
          message: normalized.errors.map((error) => error.message).join("; "),
          deviceAddr,
          raw: point,
        })
      }
    }
  }

  return {
    total: samples.length + failures.length,
    updated: samples.length,
    failed: failures.length,
    ts: now,
    status:
      failures.length === 0
        ? syncStatuses.SUCCESS
        : samples.length > 0
          ? syncStatuses.PARTIAL_SUCCESS
          : syncStatuses.FAILED,
    samples,
    failures,
  }
}

export function classifyRenkeClientError(error: unknown): RenkeSyncFailure {
  const message = error instanceof Error ? error.message : String(error)
  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes("token") ||
    lowerMessage.includes("auth") ||
    lowerMessage.includes("401") ||
    lowerMessage.includes("403")
  ) {
    return {
      code: renkeSyncErrorCodes.AUTH_TIMEOUT,
      message,
    }
  }

  if (
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("timed out") ||
    lowerMessage.includes("network")
  ) {
    return {
      code: renkeSyncErrorCodes.SOURCE_TIMEOUT,
      message,
    }
  }

  return {
    code: renkeSyncErrorCodes.SCHEMA_MISMATCH,
    message,
  }
}

export function resolveRenkeMetric(point: RenkeRealtimeDataPoint) {
  const label = String(
    point.name ?? point.factorName ?? point.nodeName ?? point.key ?? "",
  ).toLowerCase()

  return renkeMetricMappings.find((mapping) =>
    mapping.patterns.some((pattern) => label.includes(pattern.toLowerCase())),
  )
}

function isRenkePointAlarming(point: RenkeRealtimeDataPoint) {
  return [point.alarmStatus, point.alarming].some((value) => {
    if (typeof value === "boolean") {
      return value
    }

    return value === 1 || value === "1" || value === "true" || value === "alarm"
  })
}

function createRenkePayloadHash(point: RenkeRealtimeDataPoint) {
  const source = JSON.stringify(point)
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return `renke-${hash.toString(16)}`
}
