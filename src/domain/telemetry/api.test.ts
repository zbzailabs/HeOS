import { describe, expect, it } from "vitest"

import { metricCodes } from "../standards/enums"
import {
  parseTelemetryHistoryQuery,
  parseTelemetryLatestQuery,
  telemetryApiErrorCodes,
} from "./api"

describe("telemetry api query validation", () => {
  it("returns standard 400 errors with traceId for missing latest params", () => {
    const result = parseTelemetryLatestQuery(new URLSearchParams(), "trace-test")

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      traceId: "trace-test",
    })
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toEqual([
      telemetryApiErrorCodes.MISSING_PARAM,
      telemetryApiErrorCodes.MISSING_PARAM,
      telemetryApiErrorCodes.MISSING_PARAM,
    ])
  })

  it("accepts valid latest query params", () => {
    const result = parseTelemetryLatestQuery(
      new URLSearchParams({
        tenantId: "tenant-1",
        deviceId: "device-1",
        metricCode: metricCodes.SOIL_PH,
      }),
      "trace-test",
    )

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        tenantId: "tenant-1",
        deviceId: "device-1",
        metricCode: metricCodes.SOIL_PH,
      },
    })
  })

  it("rejects invalid and oversized history windows", () => {
    const result = parseTelemetryHistoryQuery(
      new URLSearchParams({
        tenantId: "tenant-1",
        deviceId: "device-1",
        metricCode: metricCodes.SOIL_PH,
        fromTs: "2026-06-10T00:00:00.000Z",
        toTs: "2026-06-20T00:00:00.000Z",
      }),
      "trace-test",
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain(
      telemetryApiErrorCodes.TIME_WINDOW_TOO_LARGE,
    )
  })

  it("rejects fromTs after toTs", () => {
    const result = parseTelemetryHistoryQuery(
      new URLSearchParams({
        tenantId: "tenant-1",
        deviceId: "device-1",
        metricCode: metricCodes.SOIL_PH,
        fromTs: "2026-06-10T02:00:00.000Z",
        toTs: "2026-06-10T01:00:00.000Z",
      }),
      "trace-test",
    )

    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain(
      telemetryApiErrorCodes.INVALID_TIME_WINDOW,
    )
  })

  it("parses history cursor parameters for stable D1 pagination", () => {
    const result = parseTelemetryHistoryQuery(
      new URLSearchParams({
        tenantId: "tenant-1",
        deviceId: "device-1",
        metricCode: metricCodes.SOIL_PH,
        fromTs: "2026-06-10T00:00:00.000Z",
        toTs: "2026-06-10T02:00:00.000Z",
        cursorObservedAt: "2026-06-10T01:00:00.000Z",
        cursorId: "history-cursor",
      }),
      "trace-test",
    )

    expect(result).toMatchObject({
      ok: true,
      value: {
        cursor: {
          observedAt: "2026-06-10T01:00:00.000Z",
          id: "history-cursor",
        },
      },
    })
  })
})
