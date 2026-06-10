import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  metricCodes,
  metricDefinitions,
  telemetryQualities,
} from "../standards/enums"
import {
  createTelemetryHistoryRecord,
  createTelemetryHistoryQueryPlan,
  createTelemetryLatestRecord,
  createTelemetrySampleKey,
  createTelemetryWritePlan,
  getTelemetryHistoryPage,
  getTelemetryMetricCodes,
  normalizeTelemetrySample,
  resolveTelemetryLatestRecord,
  telemetryHistoryMaxLimit,
  telemetryModelErrorCodes,
  telemetryTables,
  type TelemetrySampleInput,
} from "./model"

const migrationSql = readFileSync(
  new URL("../../../db/migrations/0003_heos_telemetry_core.sql", import.meta.url),
  "utf8",
)

const baseSampleInput = {
  tenantId: "tenant-1",
  siteId: "site-1",
  deviceId: "device-1",
  metricCode: metricCodes.SOIL_PH,
  value: 6.7,
  source: "renke",
  observedAt: "2026-06-10T01:00:00.000Z",
} as const satisfies TelemetrySampleInput

function sample(input: Partial<TelemetrySampleInput> = {}) {
  const result = normalizeTelemetrySample({
    ...baseSampleInput,
    ...input,
  })

  if (!result.ok) {
    throw new Error("invalid test sample")
  }

  return result.value
}

describe("telemetry sample model", () => {
  it("normalizes default unit and quality from standard enums", () => {
    const normalized = sample()

    expect(normalized.unit).toBe(
      metricDefinitions[metricCodes.SOIL_PH].defaultUnit,
    )
    expect(normalized.quality).toBe(telemetryQualities.GOOD)
    expect(getTelemetryMetricCodes()).toEqual(Object.values(metricCodes))
  })

  it("rejects a unit that does not match the metric definition", () => {
    const result = normalizeTelemetrySample({
      ...baseSampleInput,
      unit: "percent",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          status: 400,
          code: telemetryModelErrorCodes.INVALID_METRIC_UNIT,
          details: {
            metricCode: metricCodes.SOIL_PH,
            expectedUnit: "ph",
            actualUnit: "percent",
          },
        },
      ],
    })
  })

  it("creates a stable latest key per tenant, site, device, and metric", () => {
    const first = createTelemetryLatestRecord(sample())
    const duplicateObservedAt = createTelemetryLatestRecord(sample({ value: 6.8 }))
    const nextMetric = createTelemetryLatestRecord(
      sample({
        metricCode: metricCodes.SOIL_MOISTURE,
        value: 41,
      }),
    )

    expect(first.id).toBe(duplicateObservedAt.id)
    expect(first.id).not.toBe(nextMetric.id)
  })

  it("keeps the latest record when a stale sample arrives", () => {
    const current = createTelemetryLatestRecord(
      sample({
        value: 6.9,
        observedAt: "2026-06-10T02:00:00.000Z",
      }),
    )
    const stale = createTelemetryLatestRecord(
      sample({
        value: 6.1,
        observedAt: "2026-06-10T01:30:00.000Z",
      }),
    )

    expect(resolveTelemetryLatestRecord(current, stale)).toBe(current)
    expect(resolveTelemetryLatestRecord(current, stale).value).toBe(6.9)
  })

  it("uses sample_key for idempotent history inserts", () => {
    const first = sample()
    const duplicate = sample({ value: 6.7 })
    const nextObservedAt = sample({
      observedAt: "2026-06-10T01:05:00.000Z",
    })

    expect(createTelemetrySampleKey(first)).toBe(
      createTelemetrySampleKey(duplicate),
    )
    expect(createTelemetrySampleKey(first)).not.toBe(
      createTelemetrySampleKey(nextObservedAt),
    )

    const writePlan = createTelemetryWritePlan(first)

    expect(writePlan.latest).toMatchObject({
      table: telemetryTables.latest,
      conflictTarget: ["tenant_id", "site_id", "device_id", "metric_code"],
      updateCondition:
        "excluded.observed_at >= heos_telemetry_latest.observed_at",
    })
    expect(writePlan.history).toMatchObject({
      table: telemetryTables.history,
      conflictTarget: "sample_key",
      onConflict: "do_nothing",
    })
  })
})

describe("telemetry history query model", () => {
  it("builds a stable descending query plan with cursor support", () => {
    const result = createTelemetryHistoryQueryPlan({
      tenantId: "tenant-1",
      siteId: "site-1",
      deviceId: "device-1",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T02:00:00.000Z",
      order: "desc",
      limit: 20,
      cursor: {
        observedAt: "2026-06-10T01:00:00.000Z",
        id: "history-id",
      },
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        table: telemetryTables.history,
        orderBy: ["observed_at DESC", "id DESC"],
        limit: 20,
      },
    })

    expect(result.ok && result.value.where).toContain(
      "(observed_at < ? OR (observed_at = ? AND id < ?))",
    )
  })

  it("rejects invalid history windows and page sizes", () => {
    const result = createTelemetryHistoryQueryPlan({
      tenantId: "tenant-1",
      siteId: "site-1",
      deviceId: "device-1",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-10T02:00:00.000Z",
      toTs: "2026-06-10T01:00:00.000Z",
      limit: telemetryHistoryMaxLimit + 1,
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: telemetryModelErrorCodes.INVALID_TIME_WINDOW,
        },
        {
          code: telemetryModelErrorCodes.INVALID_LIMIT,
        },
      ],
    })
  })

  it("returns stable pages by observedAt and id", () => {
    const records = [
      createTelemetryHistoryRecord(
        sample({
          source: "manual",
          observedAt: "2026-06-10T01:00:00.000Z",
          value: 6.5,
        }),
      ),
      createTelemetryHistoryRecord(
        sample({
          source: "renke",
          observedAt: "2026-06-10T01:00:00.000Z",
          value: 6.6,
        }),
      ),
      createTelemetryHistoryRecord(
        sample({
          source: "simulation",
          observedAt: "2026-06-10T01:05:00.000Z",
          value: 6.8,
        }),
      ),
    ]

    const firstPage = getTelemetryHistoryPage(records, {
      tenantId: "tenant-1",
      siteId: "site-1",
      deviceId: "device-1",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T02:00:00.000Z",
      order: "asc",
      limit: 2,
    })

    expect(firstPage.ok && firstPage.value.items.map((item) => item.value)).toEqual([
      6.5,
      6.6,
    ])

    const secondPage = getTelemetryHistoryPage(records, {
      tenantId: "tenant-1",
      siteId: "site-1",
      deviceId: "device-1",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T02:00:00.000Z",
      order: "asc",
      limit: 2,
      cursor: firstPage.ok ? firstPage.value.nextCursor ?? undefined : undefined,
    })

    expect(secondPage.ok && secondPage.value.items.map((item) => item.value)).toEqual([
      6.8,
    ])
  })

  it("filters history by tenant, site, device, metric, and time window", () => {
    const records = [
      createTelemetryHistoryRecord(sample({ value: 6.5 })),
      createTelemetryHistoryRecord(sample({ deviceId: "device-2", value: 6.6 })),
      createTelemetryHistoryRecord(
        sample({
          metricCode: metricCodes.SOIL_MOISTURE,
          value: 41,
        }),
      ),
      createTelemetryHistoryRecord(
        sample({
          observedAt: "2026-06-11T01:00:00.000Z",
          value: 6.9,
        }),
      ),
    ]

    const result = getTelemetryHistoryPage(records, {
      tenantId: "tenant-1",
      siteId: "site-1",
      deviceId: "device-1",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T02:00:00.000Z",
      order: "desc",
    })

    expect(result.ok && result.value.items).toHaveLength(1)
    expect(result.ok && result.value.items[0]?.value).toBe(6.5)
  })
})

describe("telemetry D1 migration", () => {
  it("creates latest and history tables with required constraints", () => {
    expect(migrationSql).toContain(
      `CREATE TABLE IF NOT EXISTS ${telemetryTables.latest}`,
    )
    expect(migrationSql).toContain(
      `CREATE TABLE IF NOT EXISTS ${telemetryTables.history}`,
    )
    expect(migrationSql).toContain(
      "UNIQUE (tenant_id, site_id, device_id, metric_code)",
    )
    expect(migrationSql).toContain("sample_key TEXT NOT NULL UNIQUE")
    expect(migrationSql).toContain("value REAL NOT NULL")
  })

  it("adds indexes for latest lookup and history pagination", () => {
    expect(migrationSql).toContain(
      "idx_heos_telemetry_latest_tenant_device",
    )
    expect(migrationSql).toContain(
      "idx_heos_telemetry_history_device_metric_time",
    )
    expect(migrationSql).toContain("observed_at")
    expect(migrationSql).toContain("id")
  })

  it("uses D1-compatible column types and enum checks", () => {
    expect(migrationSql).not.toMatch(/\bSERIAL\b/i)
    expect(migrationSql).not.toMatch(/\bVARCHAR\b/i)
    expect(migrationSql).not.toMatch(/\bJSONB\b/i)

    for (const metricCode of Object.values(metricCodes)) {
      expect(migrationSql).toContain(`'${metricCode}'`)
    }

    for (const quality of Object.values(telemetryQualities)) {
      expect(migrationSql).toContain(`'${quality}'`)
    }
  })
})
