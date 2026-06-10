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
      "src/domain/core/query.ts",
      "src/domain/core/api.ts",
      "src/routes/api/core/devices.ts",
    ],
    gap: null,
    plan: "后续将内存 repository 切换为 D1 repository。",
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
    evidence: ["src/domain/alerts/offline.ts", "src/routes/console.tsx"],
    gap: null,
    plan: "后续接入真实告警关闭和恢复审计。",
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
    "- 基于 S1-05 核心表补齐项目、作物、农事、追溯和 AI 页面。",
    "- 将仁科同步接入 Cron Triggers、Queues 和失败重试。",
    "- 将告警关闭、恢复和审计记录接入真实业务表。",
  )

  return `${lines.join("\n")}\n`
}
