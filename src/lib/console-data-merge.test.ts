import { describe, expect, it } from "vitest"

import { getConsoleDataWorkbench } from "../domain/console/workbench"
import { mergeConsoleD1WorkbenchData } from "./console-data-merge"

describe("console D1 workbench merge", () => {
  it("preserves AI operations and review metadata when D1 overrides core data", () => {
    const base = getConsoleDataWorkbench()
    const { operations: _operations, sourcePolicy: _sourcePolicy, ...d1AiAssistant } =
      base.aiAssistant
    const d1ReviewQueue = {
      ...base.aiAssistant.reviewQueue,
      emptyState: undefined,
      items: base.aiAssistant.reviewQueue.items.map(
        ({ reviewActions: _reviewActions, ...item }) => item,
      ),
    }

    const merged = mergeConsoleD1WorkbenchData(base, {
      projectAssets: { ok: true, value: base.projectAssets },
      deviceLedger: { ok: true, value: base.deviceLedger },
      alertCenter: { ok: true, value: base.alertCenter },
      agriTasks: { ok: true, value: base.agriTasks },
      traceArchives: { ok: true, value: base.traceArchives },
      aiAssistant: { ok: true, value: d1AiAssistant },
      aiReviewQueue: { ok: true, value: d1ReviewQueue },
      latestTelemetry: [],
      aiProviderOperations: {
        recentProviderCalls: 3,
        recentProviderFailures: 1,
        averageLatencyMs: 420,
        totalTokens: 1800,
        latestFailureCode: "DEEPSEEK_REQUEST_FAILED",
      },
    })

    expect(merged.aiAssistant.operations).toEqual({
      currentModelName: "deepseek-v4-flash",
      totalInteractions: d1AiAssistant.total,
      pendingReviewCount: d1ReviewQueue.total,
      latestFailureCode: "DEEPSEEK_REQUEST_FAILED",
      recentProviderCalls: 3,
      recentProviderFailures: 1,
      averageLatencyMs: 420,
      totalTokens: 1800,
    })
    expect(merged.aiAssistant.reviewQueue.emptyState).toBe(
      "当前没有待人工确认的 AI 建议。",
    )
    expect(merged.aiAssistant.reviewQueue.items[0]?.reviewActions).toEqual([
      { action: "confirm", label: "确认" },
      { action: "reject", label: "拒绝" },
    ])
  })
})
