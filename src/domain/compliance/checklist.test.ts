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
})
