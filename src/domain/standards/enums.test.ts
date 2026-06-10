import { describe, expect, it } from "vitest"

import {
  alertLevelDefinitions,
  alertLevels,
  getAlertLevelOrder,
  getMetricDefaultUnit,
  metricCodes,
  metricDefinitions,
  syncStatuses,
} from "./enums"

function expectUniqueValues(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe("standard enum definitions", () => {
  it("keeps metric codes unique", () => {
    expectUniqueValues(Object.values(metricCodes))
  })

  it("defines a default unit for every metric code", () => {
    for (const metricCode of Object.values(metricCodes)) {
      expect(metricDefinitions[metricCode].defaultUnit.length).toBeGreaterThan(0)
    }

    expect(getMetricDefaultUnit(metricCodes.AIR_TEMPERATURE)).toBe("celsius")
    expect(getMetricDefaultUnit(metricCodes.AIR_HUMIDITY)).toBe("percent")
    expect(getMetricDefaultUnit(metricCodes.SOIL_EC)).toBe("us_cm")
    expect(getMetricDefaultUnit(metricCodes.SOIL_PH)).toBe("ph")
    expect(getMetricDefaultUnit(metricCodes.RAINFALL)).toBe("mm")
  })

  it("keeps alert levels unique and ordered", () => {
    expectUniqueValues(Object.values(alertLevels))

    expect(getAlertLevelOrder(alertLevels.INFO)).toBeLessThan(
      getAlertLevelOrder(alertLevels.WARNING),
    )
    expect(getAlertLevelOrder(alertLevels.WARNING)).toBeLessThan(
      getAlertLevelOrder(alertLevels.CRITICAL),
    )

    for (const alertLevel of Object.values(alertLevels)) {
      expect(alertLevelDefinitions[alertLevel].order).toBeGreaterThan(0)
    }
  })

  it("contains required provider synchronization statuses", () => {
    expect(Object.values(syncStatuses)).toContain("auth_timeout")
    expect(Object.values(syncStatuses)).toContain("schema_mismatch")
    expect(Object.values(syncStatuses)).toContain("source_timeout")
  })
})
