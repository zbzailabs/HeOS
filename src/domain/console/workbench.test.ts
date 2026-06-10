import { describe, expect, it } from "vitest"

import { baseStandardDictionaryEntries } from "../standards/dictionary"
import { metricCodes } from "../standards/enums"
import { telemetryTables } from "../telemetry/model"
import {
  getConsoleDataWorkbench,
  heosD1Binding,
  heosD1Migrations,
} from "./workbench"

describe("console data workbench", () => {
  it("summarizes standard dictionary coverage", () => {
    const workbench = getConsoleDataWorkbench()

    expect(workbench.dictionary.totalEntries).toBe(
      baseStandardDictionaryEntries.length,
    )
    expect(workbench.dictionary.categoryCount).toBe(6)
    expect(workbench.dictionary.categories.map((item) => item.label)).toContain(
      "指标",
    )
    expect(workbench.dictionary.categories.every((item) => item.count > 0)).toBe(
      true,
    )
  })

  it("summarizes telemetry latest and history model state", () => {
    const workbench = getConsoleDataWorkbench()

    expect(workbench.telemetry.latestTable).toBe(telemetryTables.latest)
    expect(workbench.telemetry.historyTable).toBe(telemetryTables.history)
    expect(workbench.telemetry.metricCount).toBe(Object.values(metricCodes).length)
    expect(workbench.telemetry.latestConflictTarget).toBe(
      "tenant_id/site_id/device_id/metric_code",
    )
    expect(workbench.telemetry.historyConflictTarget).toBe("sample_key")
    expect(workbench.telemetry.sampleLatest).toMatchObject({
      deviceId: "rk-sensor-001",
      metricCode: metricCodes.SOIL_PH,
      unit: "ph",
    })
    expect(workbench.telemetry.sampleHistoryQuery.orderBy).toEqual([
      "observed_at DESC",
      "id DESC",
    ])
  })

  it("exposes D1 binding and migration status", () => {
    const workbench = getConsoleDataWorkbench()

    expect(workbench.d1.binding).toBe(heosD1Binding.binding)
    expect(workbench.d1.databaseName).toBe("heos")
    expect(workbench.d1.migrationsDir).toBe("db/migrations")
    expect(workbench.d1.migrations).toEqual(heosD1Migrations)
    expect(workbench.d1.migrationCount).toBe(3)
  })
})
