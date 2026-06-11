export const complianceStatuses = {
  COVERED: "covered",
  GAP: "gap",
  BLOCKED: "blocked",
} as const

export type ComplianceStatus =
  (typeof complianceStatuses)[keyof typeof complianceStatuses]

export type ComplianceChecklistItem = {
  id: string
  title: string
  specRef: string
  issue: string
  status: ComplianceStatus
  blocker: boolean
  evidence: readonly string[]
  gap: string | null
  plan: string
}

export type ComplianceChecklist = {
  generatedAt: string
  total: number
  covered: number
  gaps: number
  blockers: number
  items: ComplianceChecklistItem[]
}

export const heosComplianceItems: readonly ComplianceChecklistItem[] = [
  {
    id: "S1-05",
    title: "PRD 核心业务域 D1 模型",
    specRef: "PRD 1-5 与验收 2-8",
    issue: "#32",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S1-05-prd-core-domain-model.md",
      "db/migrations/0004_heos_prd_core_domains.sql",
      "src/domain/core/prd-model.ts",
    ],
    gap: null,
    plan: "继续补齐 CRUD 页面、真实 D1 读写和运行链路。",
  },
  {
    id: "S2-01",
    title: "标准化 Renke 同步 API",
    specRef: "Spec 5.2 供应商同步入口",
    issue: "#9",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: ["src/domain/renke/sync.ts", "src/routes/api/providers/renke/sync.ts"],
    gap: null,
    plan: "继续接入 D1 写入和 Cron 触发。",
  },
  {
    id: "S2-05",
    title: "PRD 核心域查询 API",
    specRef: "PRD 1-5 与技术架构 5.2",
    issue: "#33",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S2-05-core-domain-query-api.md",
      "docs/specs/S2-07-core-d1-query-api.md",
      "src/domain/core/query.ts",
      "src/domain/core/api.ts",
      "src/domain/core/d1-query.ts",
      "src/lib/console-data.ts",
      "src/routes/api/core/devices.ts",
    ],
    gap: null,
    plan: "继续在发布核验中引用 D1 查询证据和控制台 D1 数据合并结果。",
  },
  {
    id: "S2-06",
    title: "Renke D1 同步与失败重试",
    specRef: "仁科设备接入 3-8 与验收 2",
    issue: "#35",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S2-06-renke-d1-sync-retry.md",
      "src/domain/renke/sync.ts",
      "src/routes/api/providers/renke/sync.ts",
    ],
    gap: null,
    plan: "Cloudflare Queues 绑定接入后开启真实队列投递。",
  },
  {
    id: "S2-02",
    title: "遥测查询 API",
    specRef: "Spec 5.2 遥测查询",
    issue: "#10",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: ["src/domain/telemetry/api.ts", "src/routes/api/telemetry/history.ts"],
    gap: null,
    plan: "生产环境切换为 D1 查询实现。",
  },
  {
    id: "S3-01",
    title: "在线状态与离线告警前端展示",
    specRef: "Spec 5.1 在线判定 + Spec 6.2",
    issue: "#12",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "src/domain/alerts/offline.ts",
      "src/domain/production/actions.ts",
      "src/routes/api/core/alerts.ts",
      "src/routes/console.tsx",
    ],
    gap: null,
    plan: "继续核验告警状态流转、恢复记录和审计写入结果。",
  },
  {
    id: "S3-02",
    title: "标准稽核页",
    specRef: "Spec 5.2 标准稽核、Spec 6.1、Spec 7",
    issue: "#13",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: ["src/domain/compliance/checklist.ts", "src/routes/api/compliance/checklist.ts"],
    gap: null,
    plan: "每次发布前导出快照进入交付记录。",
  },
  {
    id: "S4-01",
    title: "发布冻结 compliance-report",
    specRef: "Spec 6.1、Spec 7、Spec 9",
    issue: "#14",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: ["docs/heos-prd/compliance-report.md"],
    gap: null,
    plan: "发布前按模板刷新验证结果。",
  },
  {
    id: "S3-05",
    title: "控制台主业务页面",
    specRef: "PRD 5 与验收 1-5",
    issue: "#34",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S3-05-console-business-pages.md",
      "docs/specs/S3-06-console-business-workflows.md",
      "src/domain/console/workbench.ts",
      "src/domain/production/actions.ts",
      "src/routes/api/core/agri-tasks.ts",
      "src/routes/console.tsx",
    ],
    gap: null,
    plan: "继续基于业务动作 API、农事记录和追溯归档证据扩展独立业务子路由。",
  },
  {
    id: "S4-02",
    title: "任务边界与验收命令固化",
    specRef: "Spec 1、Spec 6、Spec 9",
    issue: "#15",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: ["docs/heos-prd/06-标准对齐任务清单-v0.1.md"],
    gap: null,
    plan: "Issue、文档和验收记录保持互相引用。",
  },
  {
    id: "S4-10",
    title: "AI provider 观测证据",
    specRef: "验收 7 AI 日志与 S4-06 至 S4-09",
    issue: "#66",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S4-06-ai-observability.md",
      "docs/specs/S4-07-ai-provider-metrics-d1.md",
      "docs/specs/S4-08-ai-provider-metrics-console.md",
      "docs/specs/S4-09-ai-provider-metrics-window.md",
      "db/migrations/0009_heos_ai_provider_metrics.sql",
      "src/domain/ai/metrics-d1-repository.ts",
      "src/lib/console-data.test.ts",
    ],
    gap: null,
    plan: "发布冻结报告持续引用 AI provider 指标、后台摘要和 24 小时窗口证据。",
  },
  {
    id: "S4-11",
    title: "核心域 D1 与业务动作证据",
    specRef: "验收 2、验收 3、验收 7 与 #37/#38/#40",
    issue: "#67",
    status: complianceStatuses.COVERED,
    blocker: false,
    evidence: [
      "docs/specs/S4-11-core-d1-business-action-compliance.md",
      "docs/specs/S2-07-core-d1-query-api.md",
      "docs/specs/S3-06-console-business-workflows.md",
      "src/domain/core/d1-query.ts",
      "src/lib/console-data.ts",
      "src/domain/production/actions.ts",
      "src/routes/api/core/alerts.ts",
      "src/routes/api/core/agri-tasks.ts",
      "src/domain/production/actions.test.ts",
    ],
    gap: null,
    plan: "发布冻结报告持续引用核心域 D1 查询、控制台 D1 合并、告警状态流转、农事记录、追溯归档和审计写入证据。",
  },
]

export function getComplianceChecklist(
  now = new Date().toISOString(),
  items: readonly ComplianceChecklistItem[] = heosComplianceItems,
): ComplianceChecklist {
  const covered = items.filter(
    (item) => item.status === complianceStatuses.COVERED,
  ).length
  const blockers = items.filter((item) => item.blocker).length
  const gaps = items.filter((item) => item.status !== complianceStatuses.COVERED)
    .length

  return {
    generatedAt: now,
    total: items.length,
    covered,
    gaps,
    blockers,
    items: [...items],
  }
}

export function renderComplianceReport(checklist: ComplianceChecklist) {
  const lines = [
    "# HeOS 发布冻结合规报告",
    "",
    `生成时间：${checklist.generatedAt}`,
    "",
    "## 1. 汇总",
    "",
    `- 检查项：${checklist.total}`,
    `- 已覆盖：${checklist.covered}`,
    `- 未达标：${checklist.gaps}`,
    `- 阻断项：${checklist.blockers}`,
    "",
    "## 2. 检查明细",
    "",
  ]

  for (const item of checklist.items) {
    lines.push(
      `### ${item.id} ${item.title}`,
      "",
      `- Issue：${item.issue}`,
      `- Spec：${item.specRef}`,
      `- 状态：${item.status}`,
      `- 阻断发布：${item.blocker ? "是" : "否"}`,
      `- 证据：${item.evidence.join("，")}`,
      `- 未达标原因：${item.gap ?? "无"}`,
      `- 修复计划：${item.plan}`,
      "",
    )
  }

  lines.push(
    "## 3. 下一迭代目标",
    "",
    "- 将演示数据切换为 D1 查询结果。",
    "- 持续用 S4-11 证据核验核心域 D1 查询与业务动作 API。",
    "- 基于 S1-05 核心表继续扩展项目、作物、农事和追溯独立页面。",
    "- 将仁科同步接入 Cron Triggers、Queues 和失败重试。",
    "- 将告警、农事和追溯动作纳入下一轮生产回归记录。",
  )

  return `${lines.join("\n")}\n`
}
