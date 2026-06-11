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
import {
  createCoreApiHandlers,
  defaultCoreProjectId,
  defaultCoreTenantId,
} from "../core/api"
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
  "0005_heos_alert_rules.sql",
  "0006_heos_audit_standard_fields.sql",
  "0007_heos_rainfall_metric_and_tenglong_field_state.sql",
  "0008_heos_ai_review_actions.sql",
  "0009_heos_ai_provider_metrics.sql",
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

const businessPages = [
  {
    id: "project-assets",
    title: "项目资产",
    description: "项目、基地、地块、大棚和现场设备资产。",
    href: "#project-assets",
  },
  {
    id: "device-ledger",
    title: "设备台账",
    description: "设备在线状态、供应商编号、基地筛选和分页游标。",
    href: "#device-ledger",
  },
  {
    id: "crop-models",
    title: "作物模型",
    description: "作物品种、生育阶段和当前生产周期。",
    href: "#crop-models",
  },
  {
    id: "agri-tasks",
    title: "农事任务",
    description: "按状态筛选的农事计划和执行记录入口。",
    href: "#agri-tasks",
  },
  {
    id: "alert-center",
    title: "告警中心",
    description: "开放告警、设备关联和原因说明。",
    href: "#alert-center",
  },
  {
    id: "trace-archives",
    title: "追溯档案",
    description: "仅展示允许公开的追溯批次。",
    href: "#trace-archives",
  },
  {
    id: "ai-assistant",
    title: "AI 辅助记录",
    description: "AI 场景、模型和成本记录。",
    href: "#ai-assistant",
  },
] as const

const cropModels = {
  items: [
    {
      id: "crop-model-teaching-tomato",
      cropName: "番茄",
      cultivar: "教学示范番茄",
      activeStage: "苗期",
      stageCount: 4,
      cycleId: "cycle-teaching-tomato",
      siteId: "site-tenglong-smart-farm",
      status: "active",
    },
  ],
  total: 1,
  emptyState: "当前项目已有作物模型，后续接入 D1 后展示全部品种。",
}

const alertWorkflow = {
  auditAction: "alert.status.update",
  permissionCode: "alert:update",
  steps: [
    { status: "open", label: "开放" },
    { status: "acknowledged", label: "确认" },
    { status: "resolved", label: "处理" },
    { status: "closed", label: "关闭" },
  ],
}

const agriTaskWorkflow = {
  auditAction: "agri_task.status.update",
  permissionCode: "agri-task:update",
  steps: [
    { status: "planned", label: "计划" },
    { status: "doing", label: "执行" },
    { status: "done", label: "验收" },
  ],
}

const tracePublicFields = [
  "project",
  "crop",
  "cycle",
  "agriRecords",
  "inspectionSummary",
] as const

const aiSourcePolicy = {
  authorizedOnly: true,
  auditAction: "ai.interaction.read",
  sourceRequired: true,
}

const aiReviewActions = [
  { action: "confirm", label: "确认" },
  { action: "reject", label: "拒绝" },
] as const

const aiReviewEmptyState = "当前没有待人工确认的 AI 建议。"

const aiAssistantOperations = {
  currentModelName: "deepseek-v4-flash",
  latestFailureCode: null as string | null,
  recentProviderCalls: 0,
  recentProviderFailures: 0,
  averageLatencyMs: null as number | null,
  totalTokens: 0,
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
  const coreHandlers = createCoreApiHandlers()
  const projectAssets = assertCoreResult(
    coreHandlers.projectDetail(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
        projectId: defaultCoreProjectId,
      }),
      "console_project_assets",
    ),
  )
  const deviceLedger = assertCoreResult(
    coreHandlers.devices(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
        siteId: "site-tenglong-smart-farm",
        limit: "1",
      }),
      "console_device_ledger",
    ),
  )
  const alertCenter = assertCoreResult(
    coreHandlers.alerts(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
        status: "open",
      }),
      "console_alert_center",
    ),
  )
  const agriTasks = assertCoreResult(
    coreHandlers.agriTasks(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
        status: "planned",
      }),
      "console_agri_tasks",
    ),
  )
  const traceArchives = assertCoreResult(
    coreHandlers.traceArchives(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
      }),
      "console_trace_archives",
    ),
  )
  const aiAssistant = assertCoreResult(
    coreHandlers.aiInteractions(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
      }),
      "console_ai_assistant",
    ),
  )
  const aiReviewQueue = assertCoreResult(
    coreHandlers.aiReviewQueue(
      new URLSearchParams({
        tenantId: defaultCoreTenantId,
      }),
      "console_ai_review_queue",
    ),
  )

  return {
    businessPages,
    projectAssets,
    deviceLedger,
    cropModels,
    agriTasks: {
      ...agriTasks,
      workflow: agriTaskWorkflow,
    },
    alertCenter: {
      ...alertCenter,
      workflow: alertWorkflow,
    },
    traceArchives: {
      ...traceArchives,
      items: traceArchives.items.filter((archive) => archive.visibility === "public"),
      publicFields: tracePublicFields,
    },
    aiAssistant: {
      ...aiAssistant,
      reviewQueue: {
        ...aiReviewQueue,
        emptyState: aiReviewEmptyState,
        items: aiReviewQueue.items.map((item) => ({
          ...item,
          reviewActions: aiReviewActions,
        })),
      },
      operations: {
        ...aiAssistantOperations,
        totalInteractions: aiAssistant.total,
        pendingReviewCount: aiReviewQueue.total,
      },
      sourcePolicy: aiSourcePolicy,
    },
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
      productionLatest: [] as {
        id: string
        deviceId: string
        metricCode: string
        value: number
        unit: string
        quality: string
        observedAt: string
      }[],
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

function assertCoreResult<T>(result: { ok: true; value: T } | { ok: false }) {
  if (!result.ok) {
    throw new Error("Console core query seed must satisfy S3-05 requirements")
  }

  return result.value
}
