import {
  metricCodes,
  syncStatuses,
  telemetryQualities,
  type MetricCode,
  type SyncStatus,
} from "../standards/enums"
import {
  createTelemetryWritePlan,
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
  devicelng?: string | number
  devicelat?: string | number
  lng?: string | number
  lat?: string | number
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

export type RenkeSyncRunInput = {
  traceId: string
  startedAt: string
  finishedAt: string
  deviceCount: number
  successCount: number
  failedCount: number
  status: SyncStatus
  errorCode?: string | null
  errorMessage?: string | null
  queueMessageId?: string | null
}

export type RenkeD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
    }
  }
}

export type RenkeD1SyncRepository = ReturnType<typeof createRenkeD1SyncRepository>

export type RenkeRetryPlan =
  | {
      shouldRetry: true
      queueName: "renke-sync-retry"
      delaySeconds: number
      nextAttempt: number
      reason: RenkeSyncErrorCode
    }
  | {
      shouldRetry: false
      reason: RenkeSyncErrorCode
      nextAttempt: number
    }

export type RenkeSyncQueueMessage = {
  provider: typeof renkeProviderId
  tenantId: typeof renkeTenantId
  deviceAddr: typeof renkeDeviceAddr
  attempt: number
  traceId: string
}

export type RenkeReplayPlan =
  | {
      ok: true
      provider: typeof renkeProviderId
      tenantId: typeof renkeTenantId
      deviceAddr: typeof renkeDeviceAddr
      traceId: string
      fromTs: string
      toTs: string
    }
  | {
      ok: false
      status: 400
      code: "RENKE_REPLAY_INVALID_WINDOW"
      message: string
      traceId: string
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

export function resolveRenkeHistoryEndpoint(deviceType: string | undefined) {
  switch (deviceType) {
    case "met":
      return "/api/v2.0/met/history/getHistoryDataList"
    case "soil":
      return "/api/v2.0/soil/history/getHistoryDataList"
    case "irrigation":
      return "/api/v2.0/irrigation/device/getDeviceHistoryList"
    case "irrigation2":
    case "irrigation3.1":
    case "irrigation3.3":
      return "/api/v2.0/irrigation/device/getDeviceHistoryList"
    default:
      return null
  }
}

export function findRenkeDeviceByAddr(
  devices: readonly RenkeRealtimeDevice[],
  deviceAddr: string,
) {
  return devices.find((device) => device.deviceAddr === deviceAddr) ?? null
}

export function createRenkeRetryPlan(
  failure: RenkeSyncFailure,
  currentAttempt: number,
): RenkeRetryPlan {
  const nextAttempt = currentAttempt + 1
  const retryable =
    failure.code === renkeSyncErrorCodes.AUTH_TIMEOUT ||
    failure.code === renkeSyncErrorCodes.SOURCE_TIMEOUT

  if (!retryable || currentAttempt >= 3) {
    return {
      shouldRetry: false,
      reason: failure.code,
      nextAttempt,
    }
  }

  return {
    shouldRetry: true,
    queueName: "renke-sync-retry",
    delaySeconds: Math.min(currentAttempt * 60, 300),
    nextAttempt,
    reason: failure.code,
  }
}

export function createRenkeSyncQueueMessage(input: {
  traceId: string
  attempt?: number
}): RenkeSyncQueueMessage {
  return {
    provider: renkeProviderId,
    tenantId: renkeTenantId,
    deviceAddr: renkeDeviceAddr,
    attempt: input.attempt ?? 1,
    traceId: input.traceId,
  }
}

export function createRenkeReplayPlan(input: {
  traceId: string
  fromTs: string
  toTs: string
}): RenkeReplayPlan {
  if (Date.parse(input.fromTs) > Date.parse(input.toTs)) {
    return {
      ok: false,
      status: 400,
      code: "RENKE_REPLAY_INVALID_WINDOW",
      message: "fromTs must be earlier than or equal to toTs.",
      traceId: input.traceId,
    }
  }

  return {
    ok: true,
    provider: renkeProviderId,
    tenantId: renkeTenantId,
    deviceAddr: renkeDeviceAddr,
    traceId: input.traceId,
    fromTs: input.fromTs,
    toTs: input.toTs,
  }
}

export function createRenkeD1SyncRepository(db: RenkeD1Database) {
  return {
    async upsertDevice(device: RenkeRealtimeDevice, lastSeenAt: string) {
      if (!device.deviceAddr) {
        return false
      }

      await db
        .prepare(
          `INSERT INTO heos_devices (
            id,
            tenant_id,
            site_id,
            external_device_id,
            name,
            device_type,
            provider_status,
            online_status,
            last_seen_at,
            status,
            lng,
            lat,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
          ON CONFLICT (tenant_id, external_device_id) DO UPDATE SET
            name = excluded.name,
            device_type = excluded.device_type,
            provider_status = excluded.provider_status,
            online_status = excluded.online_status,
            last_seen_at = excluded.last_seen_at,
            lng = excluded.lng,
            lat = excluded.lat,
            updated_at = excluded.updated_at`,
        )
        .bind(
          createRenkeDeviceId(device.deviceAddr),
          renkeTenantId,
          renkeSiteId,
          device.deviceAddr,
          device.deviceName ?? device.deviceAddr,
          device.deviceType ?? "unknown",
          device.status ?? "unknown",
          normalizeRenkeOnlineStatus(device.status),
          lastSeenAt,
          normalizeCoordinate(device.lng ?? device.devicelng),
          normalizeCoordinate(device.lat ?? device.devicelat),
          lastSeenAt,
        )
        .run()

      return true
    },

    async writeTelemetrySample(sample: TelemetrySample) {
      const plan = createTelemetryWritePlan(sample)
      const latest = plan.latest.record
      const history = plan.history.record

      await db
        .prepare(
          `INSERT INTO heos_telemetry_latest (
            id,
            tenant_id,
            site_id,
            device_id,
            metric_code,
            value,
            unit,
            quality,
            source,
            source_sample_id,
            raw_payload_hash,
            observed_at,
            ingested_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (tenant_id, site_id, device_id, metric_code) DO UPDATE SET
            value = excluded.value,
            unit = excluded.unit,
            quality = excluded.quality,
            source = excluded.source,
            source_sample_id = excluded.source_sample_id,
            raw_payload_hash = excluded.raw_payload_hash,
            observed_at = excluded.observed_at,
            ingested_at = excluded.ingested_at,
            updated_at = excluded.updated_at
          WHERE excluded.observed_at >= heos_telemetry_latest.observed_at`,
        )
        .bind(
          latest.id,
          latest.tenantId,
          latest.siteId,
          latest.deviceId,
          latest.metricCode,
          latest.value,
          latest.unit,
          latest.quality,
          latest.source,
          latest.sourceSampleId,
          latest.rawPayloadHash,
          latest.observedAt,
          latest.ingestedAt,
          latest.ingestedAt,
        )
        .run()

      await db
        .prepare(
          `INSERT INTO heos_telemetry_history (
            id,
            sample_key,
            tenant_id,
            site_id,
            device_id,
            metric_code,
            value,
            unit,
            quality,
            source,
            source_sample_id,
            raw_payload_hash,
            observed_at,
            ingested_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (sample_key) DO NOTHING`,
        )
        .bind(
          history.id,
          history.sampleKey,
          history.tenantId,
          history.siteId,
          history.deviceId,
          history.metricCode,
          history.value,
          history.unit,
          history.quality,
          history.source,
          history.sourceSampleId,
          history.rawPayloadHash,
          history.observedAt,
          history.ingestedAt,
        )
        .run()
    },

    async recordSyncRun(input: RenkeSyncRunInput) {
      await db
        .prepare(
          `INSERT INTO heos_sync_runs (
            id,
            trace_id,
            tenant_id,
            provider_code,
            started_at,
            finished_at,
            device_count,
            success_count,
            failed_count,
            status,
            error_code,
            error_message,
            queue_message_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          createRenkeSyncRunId(input.traceId, input.startedAt),
          input.traceId,
          renkeTenantId,
          renkeProviderId,
          input.startedAt,
          input.finishedAt,
          input.deviceCount,
          input.successCount,
          input.failedCount,
          input.status,
          input.errorCode ?? null,
          input.errorMessage ?? null,
          input.queueMessageId ?? null,
        )
        .run()
    },
  }
}

export async function persistRenkeSyncToD1(
  repository: RenkeD1SyncRepository,
  input: {
    traceId: string
    startedAt: string
    finishedAt: string
    devices: readonly RenkeRealtimeDevice[]
    summary: RenkeSyncSummary
  },
) {
  let deviceWrites = 0
  let latestWrites = 0
  let historyWrites = 0

  for (const device of input.devices) {
    if (await repository.upsertDevice(device, input.summary.ts)) {
      deviceWrites += 1
    }
  }

  for (const sample of input.summary.samples) {
    await repository.writeTelemetrySample(sample)
    latestWrites += 1
    historyWrites += 1
  }

  await repository.recordSyncRun({
    traceId: input.traceId,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    deviceCount: input.devices.length,
    successCount: input.summary.updated,
    failedCount: input.summary.failed,
    status: input.summary.status,
    errorCode: input.summary.failures[0]?.code ?? null,
    errorMessage: input.summary.failures[0]?.message ?? null,
  })

  return {
    deviceWrites,
    latestWrites,
    historyWrites,
    syncRunWrites: 1,
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

function createRenkeDeviceId(deviceAddr: string) {
  return `device-renke-${deviceAddr}`
}

function createRenkeSyncRunId(traceId: string, startedAt: string) {
  return `sync-renke-${createStableHash(`${traceId}:${startedAt}`)}`
}

function normalizeRenkeOnlineStatus(status: string | undefined) {
  if (status === "online" || status === "alarm") {
    return "online"
  }

  if (status === "offline") {
    return "offline"
  }

  return "unknown"
}

function normalizeCoordinate(value: string | number | undefined) {
  if (value === undefined || value === "") {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
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
  return `renke-${createStableHash(JSON.stringify(point))}`
}

function createStableHash(source: string) {
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return hash.toString(16)
}
