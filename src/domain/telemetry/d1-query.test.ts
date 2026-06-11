import { describe, expect, it } from "vitest"

import { metricCodes } from "../standards/enums"
import { createD1TelemetryQueryRepository } from "./d1-query"

describe("telemetry D1 query repository", () => {
  it("queries telemetry history with tenant, device, metric, time window and stable ordering", async () => {
    const db = createFakeTelemetryD1([
      {
        id: "history-newer",
        sample_key: "sample-newer",
        tenant_id: "tenant-tenglong-school",
        site_id: "site-tenglong-smart-farm",
        device_id: "device-renke-40406816",
        metric_code: metricCodes.SOIL_PH,
        value: 6.8,
        unit: "ph",
        quality: "good",
        source: "renke",
        source_sample_id: "renke-sample-newer",
        raw_payload_hash: "hash-newer",
        observed_at: "2026-06-11T08:00:00.000Z",
        ingested_at: "2026-06-11T08:00:02.000Z",
      },
      {
        id: "history-older",
        sample_key: "sample-older",
        tenant_id: "tenant-tenglong-school",
        site_id: "site-tenglong-smart-farm",
        device_id: "device-renke-40406816",
        metric_code: metricCodes.SOIL_PH,
        value: 6.7,
        unit: "ph",
        quality: "good",
        source: "renke",
        source_sample_id: "renke-sample-older",
        raw_payload_hash: "hash-older",
        observed_at: "2026-06-11T07:00:00.000Z",
        ingested_at: "2026-06-11T07:00:02.000Z",
      },
    ])
    const repository = createD1TelemetryQueryRepository(db)

    const result = await repository.getHistory({
      tenantId: "tenant-tenglong-school",
      siteId: "site-tenglong-smart-farm",
      deviceId: "device-renke-40406816",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-11T00:00:00.000Z",
      toTs: "2026-06-11T23:59:59.000Z",
      order: "desc",
      limit: 2,
    })

    expect(db.sql).toContain("FROM heos_telemetry_history")
    expect(db.sql).toContain("tenant_id = ?")
    expect(db.sql).toContain("site_id = ?")
    expect(db.sql).toContain("device_id = ?")
    expect(db.sql).toContain("metric_code = ?")
    expect(db.sql).toContain("observed_at >= ?")
    expect(db.sql).toContain("observed_at <= ?")
    expect(db.sql).toContain("ORDER BY observed_at DESC, id DESC")
    expect(db.sql).toContain("LIMIT ?")
    expect(db.values).toEqual([
      "tenant-tenglong-school",
      "site-tenglong-smart-farm",
      "device-renke-40406816",
      metricCodes.SOIL_PH,
      "2026-06-11T00:00:00.000Z",
      "2026-06-11T23:59:59.000Z",
      2,
    ])
    expect(result).toEqual({
      items: [
        {
          id: "history-newer",
          sampleKey: "sample-newer",
          tenantId: "tenant-tenglong-school",
          siteId: "site-tenglong-smart-farm",
          deviceId: "device-renke-40406816",
          metricCode: metricCodes.SOIL_PH,
          value: 6.8,
          unit: "ph",
          quality: "good",
          source: "renke",
          sourceSampleId: "renke-sample-newer",
          rawPayloadHash: "hash-newer",
          observedAt: "2026-06-11T08:00:00.000Z",
          ingestedAt: "2026-06-11T08:00:02.000Z",
        },
        expect.objectContaining({
          id: "history-older",
          observedAt: "2026-06-11T07:00:00.000Z",
        }),
      ],
      nextCursor: {
        id: "history-older",
        observedAt: "2026-06-11T07:00:00.000Z",
      },
    })
  })

  it("binds cursor parameters for stable descending pagination", async () => {
    const db = createFakeTelemetryD1([])
    const repository = createD1TelemetryQueryRepository(db)

    await repository.getHistory({
      tenantId: "tenant-tenglong-school",
      siteId: "site-tenglong-smart-farm",
      deviceId: "device-renke-40406816",
      metricCode: metricCodes.SOIL_PH,
      fromTs: "2026-06-11T00:00:00.000Z",
      toTs: "2026-06-11T23:59:59.000Z",
      order: "desc",
      limit: 10,
      cursor: {
        observedAt: "2026-06-11T08:00:00.000Z",
        id: "history-newer",
      },
    })

    expect(db.sql).toContain(
      "(observed_at < ? OR (observed_at = ? AND id < ?))",
    )
    expect(db.values).toEqual([
      "tenant-tenglong-school",
      "site-tenglong-smart-farm",
      "device-renke-40406816",
      metricCodes.SOIL_PH,
      "2026-06-11T00:00:00.000Z",
      "2026-06-11T23:59:59.000Z",
      "2026-06-11T08:00:00.000Z",
      "2026-06-11T08:00:00.000Z",
      "history-newer",
      10,
    ])
  })
})

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

function createFakeTelemetryD1(results: TelemetryHistoryRow[]) {
  return {
    sql: "",
    values: [] as unknown[],
    prepare(sql: string) {
      this.sql = sql

      return {
        bind: (...values: unknown[]) => {
          this.values = values

          return {
            all: async () => ({ results }),
          }
        },
      }
    },
  }
}
