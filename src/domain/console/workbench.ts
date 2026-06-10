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
import { getDeviceStatusDashboard } from "../alerts/offline"
import { getComplianceChecklist } from "../compliance/checklist"
import { getPrdCoverageSummary, prdDomainCoverage } from "../core/prd-model"
import {
  renkeDeviceAddr,
  renkeProviderId,
  renkeSiteId,
  renkeTenantId,
} from "../renke/sync"

export const heosD1Binding = {
  binding: "HEOS_DB",
  databaseName: "heos",
  migrationsDir: "db/migrations",
} as const

export const heosD1Migrations = [
  "0001_heos_rbac_core.sql",
  "0002_heos_standard_dictionary.sql",
  "0003_heos_telemetry_core.sql",
  "0004_heos_prd_core_domains.sql",
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

  const deviceStatus = getDeviceStatusDashboard(
    [
      {
        tenantId: renkeTenantId,
        siteId: renkeSiteId,
        deviceId: renkeDeviceAddr,
        deviceName: "腾龙小学智慧农场 40406816",
        supplierStatus: "online",
        lastSeenAt: "2026-06-10T07:58:00.000Z",
      },
      {
        tenantId: renkeTenantId,
        siteId: renkeSiteId,
        deviceId: "rk-offline-demo",
        deviceName: "离线规则演示设备",
        supplierStatus: "offline",
        lastSeenAt: "2026-06-10T07:40:00.000Z",
      },
    ],
    "2026-06-10T08:00:00.000Z",
  )
  const compliance = getComplianceChecklist("2026-06-10T08:00:00.000Z")
  const prdCoverage = getPrdCoverageSummary()

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
        "HTTP 遥测 API 已接入演示数据，生产环境下一步接入 D1 查询。",
    },
    renke: {
      providerId: renkeProviderId,
      deviceAddr: renkeDeviceAddr,
      syncEndpoint: "/api/providers/renke/sync",
      latestEndpoint: "/api/telemetry/latest",
      historyEndpoint: "/api/telemetry/history",
      credentialMode: "server-env",
    },
    deviceStatus,
    compliance,
    prdCoverage: {
      ...prdCoverage,
      domains: prdDomainCoverage.map((domain) => ({
        id: domain.id,
        title: domain.title,
        status: domain.firstReleaseStatus,
        tableCount: domain.tables.length,
        prdRefs: domain.prdRefs,
      })),
    },
    d1: {
      ...heosD1Binding,
      migrations: heosD1Migrations,
      migrationCount: heosD1Migrations.length,
    },
  }
}
