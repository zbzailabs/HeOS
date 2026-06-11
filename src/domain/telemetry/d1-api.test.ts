import { describe, expect, it } from "vitest"

import { metricCodes } from "../standards/enums"
import {
  getD1TelemetryHistory,
  getD1TelemetryLatest,
  type TelemetryLatestD1Database,
} from "./d1-api"
import type { TelemetryD1Database } from "./d1-query"

describe("telemetry D1 API helpers", () => {
  it("preserves caller traceId for latest D1 success responses", async () => {
    const result = await getD1TelemetryLatest({
      db: createLatestD1(),
      query: {
        tenantId: "tenant-tenglong-school",
        deviceId: "device-renke-40406816",
        metricCode: metricCodes.SOIL_PH,
      },
      traceId: "trace-telemetry-latest",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      traceId: "trace-telemetry-latest",
      value: {
        id: "latest-soil-ph",
        tenantId: "tenant-tenglong-school",
        deviceId: "device-renke-40406816",
        metricCode: metricCodes.SOIL_PH,
      },
    })
  })

  it("preserves caller traceId for history D1 success responses", async () => {
    const result = await getD1TelemetryHistory({
      db: createHistoryD1(),
      query: {
        tenantId: "tenant-tenglong-school",
        siteId: "site-tenglong-smart-farm",
        deviceId: "device-renke-40406816",
        metricCode: metricCodes.SOIL_PH,
        fromTs: "2026-06-11T00:00:00.000Z",
        toTs: "2026-06-11T23:59:59.000Z",
      },
      traceId: "trace-telemetry-history",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      traceId: "trace-telemetry-history",
      value: {
        items: [
          {
            id: "history-soil-ph",
            tenantId: "tenant-tenglong-school",
            metricCode: metricCodes.SOIL_PH,
          },
        ],
      },
    })
  })
})

function createLatestD1(): TelemetryLatestD1Database {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({
          results: [
            {
              id: "latest-soil-ph",
              tenant_id: "tenant-tenglong-school",
              site_id: "site-tenglong-smart-farm",
              device_id: "device-renke-40406816",
              metric_code: metricCodes.SOIL_PH,
              value: 6.8,
              unit: "ph",
              quality: "good",
              source: "renke",
              source_sample_id: "renke-latest",
              raw_payload_hash: "hash-latest",
              observed_at: "2026-06-11T08:00:00.000Z",
              ingested_at: "2026-06-11T08:00:02.000Z",
            },
          ],
        }),
      }),
    }),
  }
}

function createHistoryD1(): TelemetryD1Database {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({
          results: [
            {
              id: "history-soil-ph",
              sample_key: "sample-soil-ph",
              tenant_id: "tenant-tenglong-school",
              site_id: "site-tenglong-smart-farm",
              device_id: "device-renke-40406816",
              metric_code: metricCodes.SOIL_PH,
              value: 6.7,
              unit: "ph",
              quality: "good",
              source: "renke",
              source_sample_id: "renke-history",
              raw_payload_hash: "hash-history",
              observed_at: "2026-06-11T07:00:00.000Z",
              ingested_at: "2026-06-11T07:00:02.000Z",
            },
          ],
        }),
      }),
    }),
  }
}
