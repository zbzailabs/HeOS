import { describe, expect, test } from "vitest"

import {
  createOperationsHealthSnapshot,
  type OperationsHealthD1Database,
} from "./health"

describe("operations health", () => {
  test("summarizes production health from D1 rows", async () => {
    const snapshot = await createOperationsHealthSnapshot({
      db: createFakeHealthD1({
        tableCounts: {
          heos_projects: 1,
          heos_devices: 1,
          heos_telemetry_latest: 7,
          heos_sync_runs: 3,
          heos_alerts: 2,
          heos_ai_provider_metrics: 1,
        },
        latestSync: {
          id: "sync-renke-latest",
          status: "success",
          started_at: "2026-06-11T17:15:00.000Z",
          finished_at: "2026-06-11T17:15:05.000Z",
          success_count: 7,
          failed_count: 0,
          error_message: null,
        },
        latestTelemetryObservedAt: "2026-06-11T17:15:05.000Z",
        openAlertCount: 2,
        aiProviderRows: [
          {
            status: "success",
            latency_ms: 1200,
            total_tokens: 300,
            failure_code: null,
            created_at: "2026-06-11T17:10:00.000Z",
          },
        ],
      }),
      tenantId: "tenant-tenglong-school",
      now: new Date("2026-06-11T17:30:00.000Z"),
    })

    expect(snapshot.status).toBe("healthy")
    expect(snapshot.checks.d1TableCounts.status).toBe("healthy")
    expect(snapshot.checks.renkeLatestSync).toMatchObject({
      status: "healthy",
      latestStatus: "success",
      successCount: 7,
      failedCount: 0,
    })
    expect(snapshot.checks.telemetryFreshness).toMatchObject({
      status: "healthy",
      latestObservedAt: "2026-06-11T17:15:05.000Z",
    })
    expect(snapshot.checks.alerts.openCount).toBe(2)
    expect(snapshot.checks.aiProviderWindow).toMatchObject({
      status: "healthy",
      recentProviderCalls: 1,
      recentProviderFailures: 0,
      totalTokens: 300,
    })
  })

  test("marks the snapshot degraded when sync failed or telemetry is missing", async () => {
    const snapshot = await createOperationsHealthSnapshot({
      db: createFakeHealthD1({
        tableCounts: {
          heos_projects: 1,
          heos_devices: 1,
          heos_telemetry_latest: 0,
          heos_sync_runs: 1,
          heos_alerts: 0,
          heos_ai_provider_metrics: 0,
        },
        latestSync: {
          id: "sync-renke-failed",
          status: "schema_mismatch",
          started_at: "2026-06-11T17:15:00.000Z",
          finished_at: "2026-06-11T17:15:05.000Z",
          success_count: 0,
          failed_count: 1,
          error_message: "Renke credentials are not configured on the server.",
        },
        latestTelemetryObservedAt: null,
        openAlertCount: 0,
        aiProviderRows: [],
      }),
      tenantId: "tenant-tenglong-school",
      now: new Date("2026-06-11T17:30:00.000Z"),
    })

    expect(snapshot.status).toBe("degraded")
    expect(snapshot.checks.renkeLatestSync.status).toBe("degraded")
    expect(snapshot.checks.telemetryFreshness.status).toBe("degraded")
  })
})

function createFakeHealthD1(input: {
  tableCounts: Record<string, number>
  latestSync: Record<string, unknown> | null
  latestTelemetryObservedAt: string | null
  openAlertCount: number
  aiProviderRows: Record<string, unknown>[]
}): OperationsHealthD1Database {
  return {
    prepare(sql: string) {
      return {
        bind() {
          return {
            async first<T>() {
              if (sql.includes("COUNT(*) AS count")) {
                const tableName = Object.keys(input.tableCounts).find((name) =>
                  sql.includes(`FROM ${name}`),
                )
                return { count: tableName ? input.tableCounts[tableName] : 0 } as T
              }

              if (sql.includes("FROM heos_sync_runs")) {
                return input.latestSync as T
              }

              if (sql.includes("MAX(observed_at)")) {
                return {
                  latestObservedAt: input.latestTelemetryObservedAt,
                } as T
              }

              if (sql.includes("FROM heos_alerts")) {
                return { count: input.openAlertCount } as T
              }

              return null
            },
            async all<T>() {
              return {
                results: input.aiProviderRows,
              } as T
            },
          }
        },
      }
    },
  }
}
