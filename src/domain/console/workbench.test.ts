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
    expect(workbench.d1.migrationCount).toBe(4)
  })

  it("summarizes PRD core domain coverage", () => {
    const workbench = getConsoleDataWorkbench()

    expect(workbench.prdCoverage.tableCount).toBe(19)
    expect(workbench.prdCoverage.domains).toHaveLength(11)
    expect(workbench.prdCoverage.domains.map((domain) => domain.title)).toContain(
      "项目、基地和空间资产",
    )
    expect(
      workbench.prdCoverage.domains.every((domain) => domain.prdRefs.length > 0),
    ).toBe(true)
  })

  it("exposes PRD business pages backed by core query results", () => {
    const workbench = getConsoleDataWorkbench()

    expect(workbench.businessPages.map((page) => page.id)).toEqual([
      "project-assets",
      "device-ledger",
      "crop-models",
      "agri-tasks",
      "alert-center",
      "trace-archives",
      "ai-assistant",
    ])
    expect(workbench.projectAssets.project?.name).toBe("腾龙小学智慧农场")
    expect(workbench.deviceLedger.items).toHaveLength(1)
    expect(workbench.deviceLedger.total).toBe(2)
    expect(workbench.deviceLedger.nextCursor).toBe("device-renke-40406816")
    expect(workbench.alertCenter.items.every((alert) => alert.status === "open")).toBe(
      true,
    )
    expect(workbench.agriTasks.items.every((task) => task.status === "planned")).toBe(
      true,
    )
    expect(
      workbench.traceArchives.items.every(
        (archive) => archive.visibility === "public",
      ),
    ).toBe(true)
    expect(workbench.aiAssistant.items).toHaveLength(1)
    expect(workbench.cropModels.items).toContainEqual(
      expect.objectContaining({ cropName: "番茄", activeStage: "苗期" }),
    )
  })
})
