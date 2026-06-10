import {
  baseStandardDictionaryEntries,
  standardDictionaryCategories,
  standardDictionaryVersion,
  type StandardDictionaryCategory,
} from "../standards/dictionary"
import { metricCodes } from "../standards/enums"
import {
  createTelemetryHistoryQueryPlan,
  createTelemetryWritePlan,
  normalizeTelemetrySample,
  telemetryTables,
} from "../telemetry/model"

export const heosD1Binding = {
  binding: "HEOS_DB",
  databaseName: "heos",
  migrationsDir: "db/migrations",
} as const

export const heosD1Migrations = [
  "0001_heos_rbac_core.sql",
  "0002_heos_standard_dictionary.sql",
  "0003_heos_telemetry_core.sql",
] as const

const categoryLabels = {
  [standardDictionaryCategories.CROP]: "作物",
  [standardDictionaryCategories.GROWTH_STAGE]: "生育期",
  [standardDictionaryCategories.METRIC]: "指标",
  [standardDictionaryCategories.UNIT]: "单位",
  [standardDictionaryCategories.DEVICE_CAPABILITY]: "设备能力",
  [standardDictionaryCategories.ALERT_LEVEL]: "告警级别",
} as const satisfies Record<StandardDictionaryCategory, string>

const sampleTelemetry = normalizeTelemetrySample({
  tenantId: "tenant-demo",
  siteId: "site-demo",
  deviceId: "rk-sensor-001",
  metricCode: metricCodes.SOIL_PH,
  value: 6.7,
  source: "renke",
  observedAt: "2026-06-10T08:00:00.000Z",
})

if (!sampleTelemetry.ok) {
  throw new Error("S3-04 sample telemetry must be valid")
}

const sampleWritePlan = createTelemetryWritePlan(sampleTelemetry.value)
const sampleHistoryQuery = createTelemetryHistoryQueryPlan({
  tenantId: sampleTelemetry.value.tenantId,
  siteId: sampleTelemetry.value.siteId,
  deviceId: sampleTelemetry.value.deviceId,
  metricCode: sampleTelemetry.value.metricCode,
  fromTs: "2026-06-10T00:00:00.000Z",
  toTs: "2026-06-10T23:59:59.999Z",
  order: "desc",
  limit: 50,
})

if (!sampleHistoryQuery.ok) {
  throw new Error("S3-04 sample history query must be valid")
}

export function getConsoleDataWorkbench() {
  const categorySummaries = Object.values(standardDictionaryCategories).map(
    (category) => {
      const entries = baseStandardDictionaryEntries.filter(
        (entry) => entry.category === category,
      )

      return {
        category,
        label: categoryLabels[category],
        count: entries.length,
        activeCount: entries.filter((entry) => entry.status === "active").length,
      }
    },
  )

  return {
    dictionary: {
      version: standardDictionaryVersion,
      totalEntries: baseStandardDictionaryEntries.length,
      categoryCount: categorySummaries.length,
      categories: categorySummaries,
    },
    telemetry: {
      latestTable: telemetryTables.latest,
      historyTable: telemetryTables.history,
      metricCount: Object.values(metricCodes).length,
      latestConflictTarget: sampleWritePlan.latest.conflictTarget.join("/"),
      historyConflictTarget: sampleWritePlan.history.conflictTarget,
      sampleLatest: sampleWritePlan.latest.record,
      sampleHistoryQuery: sampleHistoryQuery.value,
      emptyState:
        "Renke 同步和 HTTP 遥测 API 尚未接入，当前展示模型状态和示例数据。",
    },
    d1: {
      ...heosD1Binding,
      migrations: heosD1Migrations,
      migrationCount: heosD1Migrations.length,
    },
  }
}
