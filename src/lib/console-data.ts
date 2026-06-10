import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { getConsoleDataWorkbench } from "../domain/console/workbench"
import { createD1CoreApiHandlers } from "../domain/core/api"
import type { CoreD1Database } from "../domain/core/d1-query"

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

  const {
    projectAssets,
    deviceLedger,
    alertCenter,
    agriTasks,
    traceArchives,
    aiAssistant,
    latestTelemetry,
  } = d1Results

  if (
    !projectAssets.ok ||
    !deviceLedger.ok ||
    !alertCenter.ok ||
    !agriTasks.ok ||
    !traceArchives.ok ||
    !aiAssistant.ok
  ) {
    return base
  }

  return {
    ...base,
    projectAssets: projectAssets.value,
    deviceLedger: deviceLedger.value,
    alertCenter: {
      ...alertCenter.value,
      workflow: base.alertCenter.workflow,
    },
    agriTasks: {
      ...agriTasks.value,
      workflow: base.agriTasks.workflow,
    },
    traceArchives: {
      ...traceArchives.value,
      items: traceArchives.value.items.filter(
        (archive) => archive.visibility === "public",
      ),
      publicFields: base.traceArchives.publicFields,
    },
    aiAssistant: {
      ...aiAssistant.value,
      sourcePolicy: base.aiAssistant.sourcePolicy,
    },
    telemetry: {
      ...base.telemetry,
      productionLatest: latestTelemetry,
      emptyState:
        latestTelemetry.length > 0
          ? "生产 D1 最近遥测已接入当前面板。"
          : base.telemetry.emptyState,
    },
  }
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
      latestTelemetry,
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
      listLatestTelemetryRows(db),
    ])

    return {
      projectAssets,
      deviceLedger,
      alertCenter,
      agriTasks,
      traceArchives,
      aiAssistant,
      latestTelemetry,
    }
  } catch {
    return null
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
