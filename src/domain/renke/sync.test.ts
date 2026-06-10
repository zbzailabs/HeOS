import { describe, expect, it } from "vitest"

import { metricCodes, syncStatuses, telemetryQualities } from "../standards/enums"
import {
  classifyRenkeClientError,
  createRenkeD1SyncRepository,
  createRenkeReplayPlan,
  createRenkeRetryPlan,
  createRenkeSyncQueueMessage,
  createRenkeSyncSummary,
  findRenkeDeviceByAddr,
  persistRenkeSyncToD1,
  renkeSyncErrorCodes,
  resolveRenkeHistoryEndpoint,
} from "./sync"

describe("renke sync normalization", () => {
  it("maps Renke realtime points to standard telemetry samples", () => {
    const summary = createRenkeSyncSummary({
      now: "2026-06-10T08:00:00.000Z",
      devices: [
        {
          deviceAddr: "40406816",
          deviceName: "腾龙小学智慧农场",
          deviceType: "soil",
          status: "online",
          data: [
            {
              factorName: "土壤湿度",
              factorId: 1,
              value: "42.5",
              unit: "%",
            },
            {
              factorName: "PH",
              factorId: 2,
              valueText: 6.8,
              alarming: 1,
            },
          ],
        },
      ],
    })

    expect(summary).toMatchObject({
      total: 2,
      updated: 2,
      failed: 0,
      status: syncStatuses.SUCCESS,
    })
    expect(summary.samples.map((sample) => sample.metricCode)).toEqual([
      metricCodes.SOIL_MOISTURE,
      metricCodes.SOIL_PH,
    ])
    expect(summary.samples[1]?.quality).toBe(telemetryQualities.SUSPECT)
  })

  it("records schema mismatch failures for unmapped points", () => {
    const summary = createRenkeSyncSummary({
      devices: [
        {
          deviceAddr: "40406816",
          data: [{ factorName: "未知指标", value: "1" }],
        },
      ],
    })

    expect(summary.failed).toBe(1)
    expect(summary.failures[0]?.code).toBe(renkeSyncErrorCodes.SCHEMA_MISMATCH)
  })

  it("classifies auth and source failures separately", () => {
    expect(classifyRenkeClientError(new Error("HTTP 401 token expired")).code).toBe(
      renkeSyncErrorCodes.AUTH_TIMEOUT,
    )
    expect(classifyRenkeClientError(new Error("network timeout")).code).toBe(
      renkeSyncErrorCodes.SOURCE_TIMEOUT,
    )
  })

  it("selects history endpoints from Renke deviceType", () => {
    expect(resolveRenkeHistoryEndpoint("met")).toBe(
      "/api/v2.0/met/history/getHistoryDataList",
    )
    expect(resolveRenkeHistoryEndpoint("soil")).toBe(
      "/api/v2.0/soil/history/getHistoryDataList",
    )
    expect(resolveRenkeHistoryEndpoint("irrigation")).toBe(
      "/api/v2.0/irrigation/device/getDeviceHistoryList",
    )
    expect(resolveRenkeHistoryEndpoint("camera")).toBeNull()
  })

  it("finds target device from Renke device list before realtime sync", () => {
    expect(
      findRenkeDeviceByAddr(
        [
          { deviceAddr: "other", deviceType: "met" },
          { deviceAddr: "40406816", deviceType: "soil" },
        ],
        "40406816",
      ),
    ).toMatchObject({ deviceAddr: "40406816", deviceType: "soil" })
  })

  it("writes devices, telemetry latest, telemetry history and sync run to D1", async () => {
    const db = createFakeD1Database()
    const repository = createRenkeD1SyncRepository(db)
    const summary = createRenkeSyncSummary({
      now: "2026-06-10T08:00:00.000Z",
      devices: [
        {
          deviceAddr: "40406816",
          deviceName: "腾龙小学智慧农场",
          deviceType: "soil",
          status: "online",
          data: [{ factorName: "土壤湿度", factorId: 1, value: "42.5" }],
        },
      ],
    })

    const result = await persistRenkeSyncToD1(repository, {
      traceId: "trace-renke",
      startedAt: "2026-06-10T07:59:59.000Z",
      finishedAt: "2026-06-10T08:00:00.000Z",
      devices: [
        {
          deviceAddr: "40406816",
          deviceName: "腾龙小学智慧农场",
          deviceType: "soil",
          status: "online",
        },
      ],
      summary,
    })

    expect(result).toEqual({
      deviceWrites: 1,
      latestWrites: 1,
      historyWrites: 1,
      syncRunWrites: 1,
    })
    expect(db.tables.heos_devices).toHaveLength(1)
    expect(db.tables.heos_telemetry_latest).toHaveLength(1)
    expect(db.tables.heos_telemetry_history).toHaveLength(1)
    expect(db.tables.heos_sync_runs).toContainEqual(
      expect.objectContaining({
        trace_id: "trace-renke",
        status: syncStatuses.SUCCESS,
        success_count: 1,
        failed_count: 0,
      }),
    )
  })

  it("records provider failures and creates bounded retry plan", async () => {
    const db = createFakeD1Database()
    const repository = createRenkeD1SyncRepository(db)
    const failure = classifyRenkeClientError(new Error("HTTP 401 token expired"))

    await repository.recordSyncRun({
      traceId: "trace-auth",
      startedAt: "2026-06-10T08:00:00.000Z",
      finishedAt: "2026-06-10T08:00:01.000Z",
      deviceCount: 0,
      successCount: 0,
      failedCount: 1,
      status: failure.code,
      errorCode: failure.code,
      errorMessage: failure.message,
    })

    expect(db.tables.heos_sync_runs[0]).toMatchObject({
      trace_id: "trace-auth",
      status: syncStatuses.AUTH_TIMEOUT,
      error_code: syncStatuses.AUTH_TIMEOUT,
    })
    expect(createRenkeRetryPlan(failure, 1)).toEqual({
      shouldRetry: true,
      queueName: "renke-sync-retry",
      delaySeconds: 60,
      nextAttempt: 2,
      reason: syncStatuses.AUTH_TIMEOUT,
    })
    expect(createRenkeRetryPlan(failure, 3).shouldRetry).toBe(false)
  })

  it("creates queue messages and replay plans with stable trace context", () => {
    expect(
      createRenkeSyncQueueMessage({
        traceId: "trace-renke",
        attempt: 2,
      }),
    ).toEqual({
      provider: "renke",
      tenantId: "tenant-tenglong-school",
      deviceAddr: "40406816",
      attempt: 2,
      traceId: "trace-renke",
    })

    expect(
      createRenkeReplayPlan({
        traceId: "trace-renke",
        fromTs: "2026-06-10T00:00:00.000Z",
        toTs: "2026-06-10T01:00:00.000Z",
      }),
    ).toEqual({
      ok: true,
      provider: "renke",
      tenantId: "tenant-tenglong-school",
      deviceAddr: "40406816",
      traceId: "trace-renke",
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T01:00:00.000Z",
    })

    expect(
      createRenkeReplayPlan({
        traceId: "trace-renke",
        fromTs: "2026-06-10T02:00:00.000Z",
        toTs: "2026-06-10T01:00:00.000Z",
      }),
    ).toMatchObject({
      ok: false,
      status: 400,
      code: "RENKE_REPLAY_INVALID_WINDOW",
    })
  })
})

function createFakeD1Database() {
  const tables = {
    heos_devices: [] as Record<string, unknown>[],
    heos_telemetry_latest: [] as Record<string, unknown>[],
    heos_telemetry_history: [] as Record<string, unknown>[],
    heos_sync_runs: [] as Record<string, unknown>[],
  }

  return {
    tables,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async run() {
              if (sql.includes("INTO heos_devices")) {
                tables.heos_devices.push({
                  id: values[0],
                  tenant_id: values[1],
                  site_id: values[2],
                  external_device_id: values[3],
                  name: values[4],
                  device_type: values[5],
                  provider_status: values[6],
                  online_status: values[7],
                  last_seen_at: values[8],
                })
              }

              if (sql.includes("INTO heos_telemetry_latest")) {
                tables.heos_telemetry_latest.push({
                  id: values[0],
                  tenant_id: values[1],
                  site_id: values[2],
                  device_id: values[3],
                  metric_code: values[4],
                })
              }

              if (sql.includes("INTO heos_telemetry_history")) {
                tables.heos_telemetry_history.push({
                  id: values[0],
                  sample_key: values[1],
                  tenant_id: values[2],
                  site_id: values[3],
                  device_id: values[4],
                  metric_code: values[5],
                })
              }

              if (sql.includes("INTO heos_sync_runs")) {
                tables.heos_sync_runs.push({
                  id: values[0],
                  trace_id: values[1],
                  tenant_id: values[2],
                  provider_code: values[3],
                  started_at: values[4],
                  finished_at: values[5],
                  device_count: values[6],
                  success_count: values[7],
                  failed_count: values[8],
                  status: values[9],
                  error_code: values[10],
                  error_message: values[11],
                  queue_message_id: values[12],
                })
              }

              return { success: true }
            },
          }
        },
      }
    },
  }
}
