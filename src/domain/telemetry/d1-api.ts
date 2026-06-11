import type { MetricCode } from "../standards/enums"
import type { TelemetryLatestRecord } from "./model"
import {
  createD1TelemetryQueryRepository,
  type TelemetryD1Database,
} from "./d1-query"
import type { TelemetryApiResult } from "./api"
import type { TelemetryHistoryQueryParams } from "./model"

export type TelemetryLatestD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{
        results?: T[]
      }>
    }
  }
}

type TelemetryLatestRow = {
  id: string
  tenant_id: string
  site_id: string
  device_id: string
  metric_code: string
  value: number
  unit: string
  quality: string
  source: "renke" | "manual" | "simulation"
  source_sample_id: string | null
  raw_payload_hash: string | null
  observed_at: string
  ingested_at: string
}

export async function getD1TelemetryLatest(input: {
  db: TelemetryLatestD1Database | undefined
  query: {
    tenantId: string
    deviceId: string
    metricCode: MetricCode
  }
  traceId: string
}): Promise<TelemetryApiResult<TelemetryLatestRecord> | null> {
  if (!input.db) {
    return null
  }

  const result = await input.db
    .prepare(
      `SELECT
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
        ingested_at
      FROM heos_telemetry_latest
      WHERE tenant_id = ? AND device_id = ? AND metric_code = ?
      LIMIT 1`,
    )
    .bind(input.query.tenantId, input.query.deviceId, input.query.metricCode)
    .all<TelemetryLatestRow>()
    .catch(() => null)

  const row = result?.results?.[0]

  if (!row) {
    return null
  }

  return {
    ok: true,
    status: 200,
    traceId: input.traceId,
    value: {
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      deviceId: row.device_id,
      metricCode: row.metric_code as MetricCode,
      value: row.value,
      unit: row.unit,
      quality: row.quality as TelemetryLatestRecord["quality"],
      source: row.source,
      sourceSampleId: row.source_sample_id,
      rawPayloadHash: row.raw_payload_hash,
      observedAt: row.observed_at,
      ingestedAt: row.ingested_at,
    },
  }
}

export async function getD1TelemetryHistory(input: {
  db: TelemetryD1Database | undefined
  query: TelemetryHistoryQueryParams
  traceId: string
}) {
  if (!input.db) {
    return null
  }

  const value = await createD1TelemetryQueryRepository(input.db)
    .getHistory(input.query)
    .catch(() => null)

  if (!value || value.items.length === 0) {
    return null
  }

  return {
    ok: true,
    status: 200,
    traceId: input.traceId,
    value,
  } as const
}
