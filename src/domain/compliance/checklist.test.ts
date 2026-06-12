import { describe, expect, it } from "vitest"

import {
  complianceStatuses,
  getComplianceChecklist,
  renderComplianceReport,
} from "./checklist"

describe("compliance checklist", () => {
  it("summarizes covered items and blockers", () => {
    const checklist = getComplianceChecklist("2026-06-10T08:00:00.000Z")

    expect(checklist.total).toBeGreaterThan(0)
    expect(checklist.covered).toBe(checklist.total)
    expect(checklist.blockers).toBe(0)
    expect(
      checklist.items.every((item) => item.status === complianceStatuses.COVERED),
    ).toBe(true)
  })

  it("renders a release freeze report with issue and spec references", () => {
    const report = renderComplianceReport(
      getComplianceChecklist("2026-06-10T08:00:00.000Z"),
    )

    expect(report).toContain("# HeOS 发布冻结合规报告")
    expect(report).toContain("Issue：#9")
    expect(report).toContain("Spec 5.2")
    expect(report).toContain("### S4-10 AI provider 观测证据")
    expect(report).toContain("Issue：#66")
    expect(report).toContain("docs/specs/S4-09-ai-provider-metrics-window.md")
    expect(report).toContain("### S4-11 核心域 D1 与业务动作证据")
    expect(report).toContain("Issue：#67")
    expect(report).toContain("src/domain/production/actions.ts")
    expect(report).toContain("### S4-13 遥测 D1 查询 traceId 贯通")
    expect(report).toContain("Issue：#69")
    expect(report).toContain("### S4-14 生产写入 API 服务端鉴权")
    expect(report).toContain("Issue：#70")
    expect(report).toContain("### S4-15 一期验收收口、生产健康检查与 R2 导出边界")
    expect(report).toContain("Issue：#71")
    expect(report).toContain("### S4-17 追溯导出 JSON 文件写入 R2")
    expect(report).toContain("Issue：#73")
    expect(report).toContain("### S4-18 追溯 JSON 导出控制台入口")
    expect(report).toContain("Issue：#74")
    expect(report).toContain("阻断项：0")
  })

  it("includes AI provider observability evidence in the release checklist", () => {
    const checklist = getComplianceChecklist("2026-06-11T22:30:00.000Z")
    const aiProviderItem = checklist.items.find((item) => item.id === "S4-10")

    expect(aiProviderItem).toEqual(
      expect.objectContaining({
        title: "AI provider 观测证据",
        issue: "#66",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(aiProviderItem?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-06-ai-observability.md",
        "docs/specs/S4-07-ai-provider-metrics-d1.md",
        "docs/specs/S4-08-ai-provider-metrics-console.md",
        "docs/specs/S4-09-ai-provider-metrics-window.md",
        "db/migrations/0009_heos_ai_provider_metrics.sql",
        "src/domain/ai/metrics-d1-repository.ts",
        "src/lib/console-data.test.ts",
      ]),
    )
  })

  it("includes telemetry history D1 evidence in the release checklist", () => {
    const checklist = getComplianceChecklist("2026-06-11T23:00:00.000Z")
    const telemetryItem = checklist.items.find(
      (checklistItem) => checklistItem.id === "S2-02",
    )

    expect(telemetryItem?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-12-telemetry-history-d1-api.md",
        "docs/specs/S4-13-telemetry-d1-trace-id.md",
        "src/domain/telemetry/d1-api.ts",
        "src/domain/telemetry/d1-query.ts",
        "src/routes/api/telemetry/history.ts",
      ]),
    )
    expect(telemetryItem?.plan).toContain("D1 历史查询")
    expect(telemetryItem?.plan).toContain("traceId")
    expect(telemetryItem?.plan).not.toContain("生产环境切换为 D1 查询实现")
  })

  it("includes core D1 query and production action evidence in the release checklist", () => {
    const checklist = getComplianceChecklist("2026-06-11T22:45:00.000Z")
    const item = checklist.items.find((checklistItem) => checklistItem.id === "S4-11")

    expect(item).toEqual(
      expect.objectContaining({
        title: "核心域 D1 与业务动作证据",
        issue: "#67",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(item?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-11-core-d1-business-action-compliance.md",
        "src/domain/core/d1-query.ts",
        "src/lib/console-data.ts",
        "src/domain/production/actions.ts",
        "src/routes/api/core/alerts.ts",
        "src/routes/api/core/agri-tasks.ts",
      ]),
    )

    const coreItem = checklist.items.find(
      (checklistItem) => checklistItem.id === "S2-05",
    )
    const alertItem = checklist.items.find(
      (checklistItem) => checklistItem.id === "S3-01",
    )

    expect(coreItem?.plan).toContain("D1 查询证据")
    expect(alertItem?.plan).toContain("告警状态流转")
  })

  it("includes telemetry D1 traceId evidence in the release checklist", () => {
    const checklist = getComplianceChecklist("2026-06-11T23:10:00.000Z")
    const item = checklist.items.find(
      (checklistItem) => checklistItem.id === "S4-13",
    )

    expect(item).toEqual(
      expect.objectContaining({
        title: "遥测 D1 查询 traceId 贯通",
        issue: "#69",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(item?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-13-telemetry-d1-trace-id.md",
        "src/domain/telemetry/d1-api.ts",
        "src/domain/telemetry/d1-api.test.ts",
      ]),
    )
    expect(item?.plan).toContain("traceId")
  })

  it("includes production write auth and phase-one health export evidence", () => {
    const checklist = getComplianceChecklist("2026-06-11T23:30:00.000Z")

    expect(checklist.items.find((item) => item.id === "S4-14")).toEqual(
      expect.objectContaining({
        title: "生产写入 API 服务端鉴权",
        issue: "#70",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(checklist.items.find((item) => item.id === "S4-15")).toEqual(
      expect.objectContaining({
        title: "一期验收收口、生产健康检查与 R2 导出边界",
        issue: "#71",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(checklist.items.find((item) => item.id === "S4-17")).toEqual(
      expect.objectContaining({
        title: "追溯导出 JSON 文件写入 R2",
        issue: "#73",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(checklist.items.find((item) => item.id === "S4-17")?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-17-trace-export-r2-json.md",
        "src/routes/api/core/trace-exports.ts",
        "wrangler.jsonc",
      ]),
    )
    expect(checklist.items.find((item) => item.id === "S4-18")).toEqual(
      expect.objectContaining({
        title: "追溯 JSON 导出控制台入口",
        issue: "#74",
        status: complianceStatuses.COVERED,
        blocker: false,
        gap: null,
      }),
    )
    expect(checklist.items.find((item) => item.id === "S4-18")?.evidence).toEqual(
      expect.arrayContaining([
        "docs/specs/S4-18-trace-export-console-action.md",
        "src/routes/console.tsx",
        "tests/e2e/console-smoke.spec.ts",
      ]),
    )
  })
})
