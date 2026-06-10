import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import {
  getDemoTelemetryLatest,
  parseTelemetryLatestQuery,
} from "../../../domain/telemetry/api"
import type { CoreD1Database } from "../../../domain/core/d1-query"

export const Route = createFileRoute("/api/telemetry/latest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = parseTelemetryLatestQuery(url.searchParams)

        if (!parsed.ok) {
          return json(
            { traceId: parsed.traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        const d1Result = await getD1TelemetryLatest(parsed.value)
        const result =
          d1Result ?? getDemoTelemetryLatest(parsed.value, parsed.traceId)

        return json(
          result.ok
            ? { traceId: result.traceId, data: result.value }
            : { traceId: result.traceId, errors: result.errors },
          { status: result.status },
        )
      },
    },
  },
})

async function getD1TelemetryLatest(query: {
  tenantId: string
  deviceId: string
  metricCode: string
}) {
  const db = (env as { HEOS_DB?: CoreD1Database }).HEOS_DB

  if (!db) {
    return null
  }

  const result = await db
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
    .bind(query.tenantId, query.deviceId, query.metricCode)
    .all<{
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
    }>()
    .catch(() => null)

  if (!result) {
    return null
  }
  const row = result.results?.[0]

  if (!row) {
    return null
  }

  return {
    ok: true,
    status: 200,
    traceId: "telemetry_d1_latest",
    value: {
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      deviceId: row.device_id,
      metricCode: row.metric_code,
      value: row.value,
      unit: row.unit,
      quality: row.quality,
      source: row.source,
      sourceSampleId: row.source_sample_id,
      rawPayloadHash: row.raw_payload_hash,
      observedAt: row.observed_at,
      ingestedAt: row.ingested_at,
    },
  } as const
}
