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
    expect(report).toContain("阻断项：0")
  })
})
