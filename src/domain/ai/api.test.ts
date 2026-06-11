import { describe, expect, it } from "vitest"

import { aiScenarios } from "./interaction"
import { handleAiInteractionPost } from "./api"
import type { AiD1Database } from "./d1-repository"

const validBody = {
  tenantId: "tenant-tenglong-school",
  userId: "user-tenglong-admin",
  scenario: aiScenarios.ALERT_EXPLANATION,
  modelName: "gpt-4.1-mini",
  inputSummary: "解释 40406816 设备离线风险",
  outputSummary: "建议先检查供应商在线状态和现场供电。",
  retrievalSources: [
    {
      tenantId: "tenant-tenglong-school",
      table: "heos_devices",
      targetId: "device-renke-40406816",
      title: "Renke 40406816",
      permissionCode: "device:telemetry:read",
    },
  ],
  costCents: 3,
  humanConfirmationRequired: true,
}

describe("AI interaction POST API boundary", () => {
  it("returns 503 when HEOS_DB is not configured", async () => {
    const result = await handleAiInteractionPost({
      body: validBody,
      traceId: "trace-ai-api-001",
      now: "2026-06-11T09:10:00.000Z",
    })

    expect(result).toEqual({
      status: 503,
      body: {
        traceId: "trace-ai-api-001",
        errors: [
          {
            code: "HEOS_DB_NOT_CONFIGURED",
            message: "HEOS_DB binding is required for AI interaction writes.",
          },
        ],
      },
    })
  })

  it("writes valid AI interactions through D1", async () => {
    const db = createFakeAiD1()
    const result = await handleAiInteractionPost({
      body: validBody,
      db,
      traceId: "trace-ai-api-002",
      now: "2026-06-11T09:10:00.000Z",
    })

    expect(result).toMatchObject({
      status: 200,
      body: {
        traceId: "trace-ai-api-002",
        data: {
          interactionId:
            "ai-interaction|trace-ai-api-002|alert_explanation|2026-06-11T09%3A10%3A00.000Z",
          auditLogId:
            "audit|trace-ai-api-002|ai.interaction.create|2026-06-11T09%3A10%3A00.000Z",
        },
      },
    })
    expect(db.statements).toHaveLength(2)
  })

  it("returns 400 for invalid source boundaries", async () => {
    const db = createFakeAiD1()
    const result = await handleAiInteractionPost({
      body: {
        ...validBody,
        retrievalSources: [],
      },
      db,
      traceId: "trace-ai-api-003",
      now: "2026-06-11T09:10:00.000Z",
    })

    expect(result).toMatchObject({
      status: 400,
      body: {
        traceId: "trace-ai-api-003",
        errors: [{ code: "AI_MISSING_RETRIEVAL_SOURCE" }],
      },
    })
    expect(db.statements).toHaveLength(0)
  })
})

function createFakeAiD1(): AiD1Database & {
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
