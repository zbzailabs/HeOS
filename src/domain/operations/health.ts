import { readAiProviderOperations } from "../../lib/console-data"

export type OperationsHealthStatus = "healthy" | "degraded"

export type OperationsHealthD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>
      all<T>(): Promise<T>
    }
  }
}

type TableCountName =
  | "heos_projects"
  | "heos_devices"
  | "heos_telemetry_latest"
  | "heos_sync_runs"
  | "heos_alerts"
  | "heos_ai_provider_metrics"

const healthTableNames: TableCountName[] = [
  "heos_projects",
  "heos_devices",
  "heos_telemetry_latest",
  "heos_sync_runs",
  "heos_alerts",
  "heos_ai_provider_metrics",
]

export async function createOperationsHealthSnapshot(input: {
  db: OperationsHealthD1Database
  tenantId: string
  now?: Date
}) {
  const now = input.now ?? new Date()
  const [
    tableCounts,
    latestSync,
    telemetryFreshness,
    alerts,
    aiProviderWindow,
  ] = await Promise.all([
    readTableCounts(input.db),
    readRenkeLatestSync(input.db, input.tenantId),
    readTelemetryFreshness(input.db, input.tenantId),
    readOpenAlerts(input.db, input.tenantId),
    readAiProviderOperations(input.db, input.tenantId, now),
  ])

  const checks = {
    d1TableCounts: tableCounts,
    renkeLatestSync: latestSync,
    telemetryFreshness,
    alerts,
    aiProviderWindow: {
      status: "healthy" as const,
      ...aiProviderWindow,
    },
  }

  const status = Object.values(checks).some(
    (check) => check.status === "degraded",
  )
    ? "degraded"
    : "healthy"

  return {
    status,
    generatedAt: now.toISOString(),
    tenantId: input.tenantId,
    checks,
  }
}

async function readTableCounts(db: OperationsHealthD1Database) {
  const counts = {} as Record<TableCountName, number>

  for (const tableName of healthTableNames) {
    const row = await db
      .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
      .bind()
      .first<{ count: number }>()
    counts[tableName] = row?.count ?? 0
  }

  return {
    status: "healthy" as const,
    counts,
  }
}

async function readRenkeLatestSync(
  db: OperationsHealthD1Database,
  tenantId: string,
) {
  const row = await db
    .prepare(
      `SELECT id, status, started_at, finished_at, success_count, failed_count, error_message
       FROM heos_sync_runs
       WHERE tenant_id = ? AND provider_code = 'renke'
       ORDER BY started_at DESC
       LIMIT 1`,
    )
    .bind(tenantId)
    .first<{
      id: string
      status: string
      started_at: string
      finished_at: string | null
      success_count: number
      failed_count: number
      error_message: string | null
    }>()

  return {
    status: row?.status === "success" ? "healthy" : "degraded",
    latestRunId: row?.id ?? null,
    latestStatus: row?.status ?? null,
    startedAt: row?.started_at ?? null,
    finishedAt: row?.finished_at ?? null,
    successCount: row?.success_count ?? 0,
    failedCount: row?.failed_count ?? 0,
    errorMessage: row?.error_message ?? null,
  }
}

async function readTelemetryFreshness(
  db: OperationsHealthD1Database,
  tenantId: string,
) {
  const row = await db
    .prepare(
      `SELECT MAX(observed_at) AS latestObservedAt
       FROM heos_telemetry_latest
       WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .first<{ latestObservedAt: string | null }>()

  return {
    status: row?.latestObservedAt ? "healthy" as const : "degraded" as const,
    latestObservedAt: row?.latestObservedAt ?? null,
  }
}

async function readOpenAlerts(
  db: OperationsHealthD1Database,
  tenantId: string,
) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM heos_alerts
       WHERE tenant_id = ? AND status = 'open'`,
    )
    .bind(tenantId)
    .first<{ count: number }>()

  return {
    status: "healthy" as const,
    openCount: row?.count ?? 0,
  }
}
