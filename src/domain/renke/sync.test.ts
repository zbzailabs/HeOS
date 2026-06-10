import { describe, expect, it } from "vitest"

import { metricCodes, syncStatuses, telemetryQualities } from "../standards/enums"
import {
  classifyRenkeClientError,
  createRenkeSyncSummary,
  renkeSyncErrorCodes,
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
})
