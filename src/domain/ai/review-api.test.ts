import { describe, expect, it } from "vitest"

import { handleAiReviewPost } from "./review-api"
import type { AiReviewD1Database } from "./review-d1-repository"

describe("AI review POST API", () => {
  it("returns 503 when HEOS_DB is missing", async () => {
    const result = await handleAiReviewPost({
      body: {
        tenantId: "tenant-tenglong-school",
        interactionId: "ai-interaction-001",
        action: "confirm",
        note: "已人工确认。",
      },
      traceId: "trace-ai-review-api-001",
      now: "2026-06-11T14:30:00.000Z",
    })

    expect(result).toMatchObject({
      status: 503,
      body: {
        traceId: "trace-ai-review-api-001",
        errors: [{ code: "HEOS_DB_NOT_CONFIGURED" }],
      },
    })
  })

  it("writes confirmed review actions", async () => {
    const db = createFakeAiReviewD1()
    const result = await handleAiReviewPost({
      body: {
        tenantId: "tenant-tenglong-school",
        userId: "user-tenglong-admin",
        interactionId: "ai-interaction-001",
        action: "confirm",
        note: "后台人工确认。",
      },
      db,
      traceId: "trace-ai-review-api-002",
      now: "2026-06-11T14:30:00.000Z",
    })

    expect(result).toMatchObject({
      status: 200,
      body: {
        traceId: "trace-ai-review-api-002",
        data: {
          reviewActionId:
            "ai-review|trace-ai-review-api-002|ai-interaction-001|confirm|2026-06-11T14%3A30%3A00.000Z",
          statusAfterAction: "confirmed",
        },
      },
    })
    expect(db.statements).toHaveLength(1)
  })

  it("returns 400 for invalid reviewer notes before touching D1", async () => {
    const db = createFakeAiReviewD1()
    const result = await handleAiReviewPost({
      body: {
        tenantId: "tenant-tenglong-school",
        interactionId: "ai-interaction-001",
        action: "reject",
        note: "",
      },
      db,
      traceId: "trace-ai-review-api-003",
      now: "2026-06-11T14:30:00.000Z",
    })

    expect(result).toMatchObject({
      status: 400,
      body: {
        traceId: "trace-ai-review-api-003",
        errors: [{ code: "AI_REVIEW_NOTE_REQUIRED" }],
      },
    })
    expect(db.statements).toHaveLength(0)
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
