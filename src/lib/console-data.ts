import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { getConsoleDataWorkbench } from "../domain/console/workbench"
import { createD1CoreApiHandlers } from "../domain/core/api"
import type { CoreD1Database } from "../domain/core/d1-query"
import { mergeConsoleD1WorkbenchData } from "./console-data-merge"

export const getCurrentConsoleDataWorkbench = createServerFn({
  method: "GET",
}).handler(async () => {
  const base = getConsoleDataWorkbench()
  const db = (env as { HEOS_DB?: CoreD1Database }).HEOS_DB

  if (!db) {
    return base
  }

  const handlers = createD1CoreApiHandlers(db)
  const d1Results = await readConsoleD1Results(db, handlers)

  if (!d1Results) {
    return base
  }

  return mergeConsoleD1WorkbenchData(base, d1Results)
})

async function readConsoleD1Results(
  db: CoreD1Database,
  handlers: ReturnType<typeof createD1CoreApiHandlers>,
) {
  try {
    const [
      projectAssets,
      deviceLedger,
      alertCenter,
      agriTasks,
      traceArchives,
      aiAssistant,
      aiReviewQueue,
      latestTelemetry,
      aiProviderOperations,
    ] = await Promise.all([
      handlers.projectDetail(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
          projectId: "project-tenglong-smart-farm",
        }),
        "console_project_assets_d1",
      ),
      handlers.devices(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
          siteId: "site-tenglong-smart-farm",
          limit: "10",
        }),
        "console_device_ledger_d1",
      ),
      handlers.alerts(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
          status: "open",
        }),
        "console_alert_center_d1",
      ),
      handlers.agriTasks(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
          limit: "10",
        }),
        "console_agri_tasks_d1",
      ),
      handlers.traceArchives(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
        }),
        "console_trace_archives_d1",
      ),
      handlers.aiInteractions(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
        }),
        "console_ai_assistant_d1",
      ),
      handlers.aiReviewQueue(
        new URLSearchParams({
          tenantId: "tenant-tenglong-school",
        }),
        "console_ai_review_queue_d1",
      ),
      listLatestTelemetryRows(db),
      readAiProviderOperations(db, "tenant-tenglong-school").catch(
        () => baseAiProviderOperations(),
      ),
    ])

    return {
      projectAssets,
      deviceLedger,
      alertCenter,
      agriTasks,
      traceArchives,
      aiAssistant,
      aiReviewQueue,
      latestTelemetry,
      aiProviderOperations,
    }
  } catch {
    return null
  }
}

export async function readAiProviderOperations(
  db: CoreD1Database,
  tenantId: string,
) {
  const result = await db
    .prepare(
      `SELECT status, latency_ms, total_tokens, failure_code, created_at
       FROM heos_ai_provider_metrics
       WHERE tenant_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
    )
    .bind(tenantId)
    .all<{
      status: string
      latency_ms: number | null
      total_tokens: number | null
      failure_code: string | null
      created_at: string
    }>()

  const rows = result.results ?? []
  const recentProviderFailures = rows.filter((row) => row.status === "failure")
  const latencyValues = rows
    .map((row) => row.latency_ms)
    .filter((value): value is number => typeof value === "number")
  const averageLatencyMs =
    latencyValues.length > 0
      ? Math.round(
          latencyValues.reduce((total, value) => total + value, 0) /
            latencyValues.length,
        )
      : null

  return {
    recentProviderCalls: rows.length,
    recentProviderFailures: recentProviderFailures.length,
    averageLatencyMs,
    totalTokens: rows.reduce(
      (total, row) =>
        total + (typeof row.total_tokens === "number" ? row.total_tokens : 0),
      0,
    ),
    latestFailureCode:
      recentProviderFailures.find((row) => row.failure_code)?.failure_code ?? null,
  }
}

function baseAiProviderOperations() {
  return {
    recentProviderCalls: 0,
    recentProviderFailures: 0,
    averageLatencyMs: null,
    totalTokens: 0,
    latestFailureCode: null,
  }
}

async function listLatestTelemetryRows(db: CoreD1Database) {
  const result = await db
    .prepare(
      `SELECT id, device_id, metric_code, value, unit, quality, observed_at
       FROM heos_telemetry_latest
       WHERE tenant_id = ?
       ORDER BY observed_at DESC, metric_code ASC
       LIMIT 8`,
    )
    .bind("tenant-tenglong-school")
    .all<{
      id: string
      device_id: string
      metric_code: string
      value: number
      unit: string
      quality: string
      observed_at: string
    }>()

  return (result.results ?? []).map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    metricCode: row.metric_code,
    value: row.value,
    unit: row.unit,
    quality: row.quality,
    observedAt: row.observed_at,
  }))
}
