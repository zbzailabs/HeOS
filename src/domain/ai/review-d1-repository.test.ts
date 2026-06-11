import { describe, expect, it } from "vitest"

import {
  aiReviewActions,
  type AiReviewActionPlanInput,
} from "./review"
import {
  createD1AiReviewRepository,
  type AiReviewD1Database,
} from "./review-d1-repository"

const validInput = {
  traceId: "trace-ai-review-d1-001",
  tenantId: "tenant-tenglong-school",
  userId: "user-tenglong-admin",
  interactionId: "ai-interaction-001",
  action: aiReviewActions.CONFIRM,
  note: "后台人工确认。",
  createdAt: "2026-06-11T14:10:00.000Z",
} as const satisfies AiReviewActionPlanInput

describe("D1 AI review repository", () => {
  it("writes review action rows and returns stable ids", async () => {
    const db = createFakeAiReviewD1()
    const result = await createD1AiReviewRepository(db).createReviewAction(
      validInput,
    )

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        reviewActionId:
          "ai-review|trace-ai-review-d1-001|ai-interaction-001|confirm|2026-06-11T14%3A10%3A00.000Z",
        statusAfterAction: "confirmed",
      },
    })
    expect(db.statements).toHaveLength(1)
    expect(db.statements[0]?.sql).toContain(
      "INSERT INTO heos_ai_review_actions",
    )
  })
})

function createFakeAiReviewD1(): AiReviewD1Database & {
  statements: { sql: string; values: unknown[] }[]
} {
  const statements: { sql: string; values: unknown[] }[] = []

  return {
    statements,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async run() {
              statements.push({ sql, values })
              return { success: true }
            },
          }
        },
      }
    },
  }
}
