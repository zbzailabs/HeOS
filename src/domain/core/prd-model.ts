export const prdDomainIds = {
  WORKBENCH: "workbench",
  TENANT_ACCESS: "tenant_access",
  SPATIAL_ASSETS: "spatial_assets",
  PROVIDER_DEVICES: "provider_devices",
  CROP_MODEL: "crop_model",
  AGRI_TASKS: "agri_tasks",
  ALERTS: "alerts",
  CONTROL: "control",
  TRACE_REPORTS: "trace_reports",
  AI_ASSISTANT: "ai_assistant",
  OBSERVABILITY: "observability",
} as const

export type PrdDomainId = (typeof prdDomainIds)[keyof typeof prdDomainIds]

export const prdCoreTables = {
  PROJECTS: "heos_projects",
  SITES: "heos_sites",
  PLOTS: "heos_plots",
  GREENHOUSES: "heos_greenhouses",
  PROVIDER_ACCOUNTS: "heos_provider_accounts",
  DEVICES: "heos_devices",
  DEVICE_METRIC_MAPPINGS: "heos_device_metric_mappings",
  CROP_MODELS: "heos_crop_models",
  CROP_MODEL_STAGES: "heos_crop_model_stages",
  CROP_CYCLES: "heos_crop_cycles",
  AGRI_TASKS: "heos_agri_tasks",
  AGRI_TASK_RECORDS: "heos_agri_task_records",
  STANDARD_RULES: "heos_standard_rules",
  ALERTS: "heos_alerts",
  CONTROL_COMMANDS: "heos_control_commands",
  TRACE_ARCHIVES: "heos_trace_archives",
  AI_INTERACTIONS: "heos_ai_interactions",
  REPORTS: "heos_reports",
  SYNC_RUNS: "heos_sync_runs",
} as const

export type PrdCoreTable = (typeof prdCoreTables)[keyof typeof prdCoreTables]

export type PrdDomainCoverage = {
  id: PrdDomainId
  title: string
  prdRefs: readonly string[]
  acceptanceRefs: readonly string[]
  tables: readonly PrdCoreTable[]
  firstReleaseStatus: "implemented" | "foundation" | "deferred"
}

export const prdDomainCoverage = [
  {
    id: prdDomainIds.WORKBENCH,
    title: "统一工作台",
    prdRefs: ["PRD 3.1", "PRD 5.2"],
    acceptanceRefs: ["验收 2 统一工作台", "验收 5 工作台首屏"],
    tables: [
      prdCoreTables.PROJECTS,
      prdCoreTables.DEVICES,
      prdCoreTables.ALERTS,
      prdCoreTables.AGRI_TASKS,
      prdCoreTables.SYNC_RUNS,
    ],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.TENANT_ACCESS,
    title: "租户与权限",
    prdRefs: ["PRD 4.1", "PRD 5.1"],
    acceptanceRefs: ["验收 3 权限隔离"],
    tables: [],
    firstReleaseStatus: "implemented",
  },
  {
    id: prdDomainIds.SPATIAL_ASSETS,
    title: "项目、基地和空间资产",
    prdRefs: ["PRD 4.2"],
    acceptanceRefs: ["验收 2 项目管理"],
    tables: [
      prdCoreTables.PROJECTS,
      prdCoreTables.SITES,
      prdCoreTables.PLOTS,
      prdCoreTables.GREENHOUSES,
    ],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.PROVIDER_DEVICES,
    title: "设备与供应商接入",
    prdRefs: ["PRD 4.3", "验收 4 仁科设备接入"],
    acceptanceRefs: ["验收 4 仁科设备接入", "验收 6 服务端访问"],
    tables: [
      prdCoreTables.PROVIDER_ACCOUNTS,
      prdCoreTables.DEVICES,
      prdCoreTables.DEVICE_METRIC_MAPPINGS,
      prdCoreTables.SYNC_RUNS,
    ],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.CROP_MODEL,
    title: "作物模型",
    prdRefs: ["PRD 4.4"],
    acceptanceRefs: ["验收 2 作物模型"],
    tables: [
      prdCoreTables.CROP_MODELS,
      prdCoreTables.CROP_MODEL_STAGES,
      prdCoreTables.CROP_CYCLES,
    ],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.AGRI_TASKS,
    title: "农事管理",
    prdRefs: ["PRD 4.5"],
    acceptanceRefs: ["验收 2 农事任务"],
    tables: [prdCoreTables.AGRI_TASKS, prdCoreTables.AGRI_TASK_RECORDS],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.ALERTS,
    title: "告警中心",
    prdRefs: ["PRD 4.6"],
    acceptanceRefs: ["验收 2 告警中心", "验收 7 告警日志"],
    tables: [prdCoreTables.STANDARD_RULES, prdCoreTables.ALERTS],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.CONTROL,
    title: "控制策略",
    prdRefs: ["PRD 4.7"],
    acceptanceRefs: ["验收 3 控制权限", "验收 6 控制命令"],
    tables: [prdCoreTables.CONTROL_COMMANDS],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.TRACE_REPORTS,
    title: "报表与追溯",
    prdRefs: ["PRD 3.5", "PRD 4.9"],
    acceptanceRefs: ["验收 2 追溯展示"],
    tables: [prdCoreTables.TRACE_ARCHIVES, prdCoreTables.REPORTS],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.AI_ASSISTANT,
    title: "AI 辅助",
    prdRefs: ["PRD 4.8"],
    acceptanceRefs: ["验收 2 AI 辅助", "验收 7 AI 日志"],
    tables: [prdCoreTables.AI_INTERACTIONS],
    firstReleaseStatus: "foundation",
  },
  {
    id: prdDomainIds.OBSERVABILITY,
    title: "观测与运维",
    prdRefs: ["PRD 5.3"],
    acceptanceRefs: ["验收 7 请求日志", "验收 7 同步日志"],
    tables: [prdCoreTables.SYNC_RUNS],
    firstReleaseStatus: "foundation",
  },
] as const satisfies readonly PrdDomainCoverage[]

export const prdCoreMigration = {
  file: "db/migrations/0004_heos_prd_core_domains.sql",
  tableCount: Object.values(prdCoreTables).length,
  forbiddenCredentialColumns: ["password", "login_pwd", "token_plaintext"],
} as const

export function getPrdCoverageSummary() {
  const domains = prdDomainCoverage.length
  const implementedDomains = prdDomainCoverage.filter(
    (domain) => domain.firstReleaseStatus === "implemented",
  ).length
  const foundationDomains = prdDomainCoverage.filter(
    (domain) => domain.firstReleaseStatus === "foundation",
  ).length

  return {
    domains,
    implementedDomains,
    foundationDomains,
    tableCount: prdCoreMigration.tableCount,
    tables: Object.values(prdCoreTables),
  }
}

export function findMissingPrdTables(migrationSql: string) {
  return Object.values(prdCoreTables).filter(
    (tableName) => !migrationSql.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`),
  )
}

export function findForbiddenCredentialColumns(migrationSql: string) {
  return prdCoreMigration.forbiddenCredentialColumns.filter((columnName) =>
    migrationSql.toLowerCase().includes(columnName),
  )
}
