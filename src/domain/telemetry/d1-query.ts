import {
  createTelemetryHistoryQueryPlan,
  type TelemetryHistoryQueryParams,
  type TelemetryHistoryRecord,
  type TelemetryHistoryCursor,
  type TelemetryQuality,
  type TelemetrySource,
} from "./model"
import type { MetricCode } from "../standards/enums"

export type TelemetryD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{
        results?: T[]
      }>
    }
  }
}

type TelemetryHistoryRow = {
  id: string
  sample_key: string
  tenant_id: string
  site_id: string
  device_id: string
  metric_code: string
  value: number
  unit: string
  quality: string
  source: string
  source_sample_id: string | null
  raw_payload_hash: string | null
  observed_at: string
  ingested_at: string
}

export function createD1TelemetryQueryRepository(db: TelemetryD1Database) {
  return {
    async getHistory(query: TelemetryHistoryQueryParams) {
      const plan = createTelemetryHistoryQueryPlan(query)

      if (!plan.ok) {
        throw new Error("Invalid telemetry history query")
      }

      const result = await db
        .prepare(
          `SELECT
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
           FROM ${plan.value.table}
           WHERE ${plan.value.where.join(" AND ")}
           ORDER BY ${plan.value.orderBy.join(", ")}
           LIMIT ?`,
        )
        .bind(...plan.value.parameters, plan.value.limit)
        .all<TelemetryHistoryRow>()

      const items = (result.results ?? []).map(mapTelemetryHistoryRow)
      const lastItem = items.at(-1)

      return {
        items,
        nextCursor: lastItem
          ? ({
              observedAt: lastItem.observedAt,
              id: lastItem.id,
            } satisfies TelemetryHistoryCursor)
          : null,
      }
    },
  }
}

function mapTelemetryHistoryRow(row: TelemetryHistoryRow): TelemetryHistoryRecord {
  return {
    id: row.id,
    sampleKey: row.sample_key,
    tenantId: row.tenant_id,
    siteId: row.site_id,
    deviceId: row.device_id,
    metricCode: row.metric_code as MetricCode,
    value: row.value,
    unit: row.unit,
    quality: row.quality as TelemetryQuality,
    source: row.source as TelemetrySource,
    sourceSampleId: row.source_sample_id,
    rawPayloadHash: row.raw_payload_hash,
    observedAt: row.observed_at,
    ingestedAt: row.ingested_at,
  }
}
