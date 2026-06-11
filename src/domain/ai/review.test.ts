import { describe, expect, it } from "vitest"

import {
  aiReviewActions,
  aiReviewStatuses,
  createAiReviewActionPlan,
} from "./review"

describe("AI review workflow", () => {
  it("creates a confirmed review action for a high-risk AI interaction", () => {
    const result = createAiReviewActionPlan({
      traceId: "trace-ai-review-001",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: "ai-interaction-001",
      action: aiReviewActions.CONFIRM,
      note: "已核对告警和设备状态，同意进入处理。",
      createdAt: "2026-06-11T14:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        reviewAction: {
          record: {
            id: "ai-review|trace-ai-review-001|ai-interaction-001|confirm|2026-06-11T14%3A00%3A00.000Z",
            tenantId: "tenant-tenglong-school",
            interactionId: "ai-interaction-001",
            action: aiReviewActions.CONFIRM,
            statusAfterAction: aiReviewStatuses.CONFIRMED,
          },
        },
      },
    })
  })

  it("creates a rejected review action", () => {
    const result = createAiReviewActionPlan({
      traceId: "trace-ai-review-002",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: "ai-interaction-001",
      action: aiReviewActions.REJECT,
      note: "建议依据不足，退回人工处理。",
      createdAt: "2026-06-11T14:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: true,
      value: {
        reviewAction: {
          record: {
            action: aiReviewActions.REJECT,
            statusAfterAction: aiReviewStatuses.REJECTED,
          },
        },
      },
    })
  })

  it("rejects empty reviewer notes", () => {
    const result = createAiReviewActionPlan({
      traceId: "trace-ai-review-003",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: "ai-interaction-001",
      action: aiReviewActions.REJECT,
      note: "",
      createdAt: "2026-06-11T14:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [{ code: "AI_REVIEW_NOTE_REQUIRED" }],
    })
  })
})
