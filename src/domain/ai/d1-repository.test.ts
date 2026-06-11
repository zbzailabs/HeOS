import { describe, expect, it } from "vitest"

import { aiScenarios, type AiInteractionWritePlanInput } from "./interaction"
import {
  createD1AiInteractionRepository,
  type AiD1Database,
} from "./d1-repository"

const baseInput = {
  traceId: "trace-ai-d1-001",
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
  createdAt: "2026-06-11T09:00:00.000Z",
} as const satisfies AiInteractionWritePlanInput

describe("D1 AI interaction repository", () => {
  it("writes audit log before AI interaction and returns stable ids", async () => {
    const db = createFakeAiD1()
    const repository = createD1AiInteractionRepository(db)

    const result = await repository.createInteraction(baseInput)

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        interactionId:
          "ai-interaction|trace-ai-d1-001|alert_explanation|2026-06-11T09%3A00%3A00.000Z",
        auditLogId:
          "audit|trace-ai-d1-001|ai.interaction.create|2026-06-11T09%3A00%3A00.000Z",
      },
    })
    expect(db.statements).toHaveLength(2)
    expect(db.statements[0]?.sql).toContain("INSERT INTO heos_audit_logs")
    expect(db.statements[1]?.sql).toContain("INSERT INTO heos_ai_interactions")
    expect(db.statements[1]?.values).toContain(
      JSON.stringify(baseInput.retrievalSources),
    )
  })

  it("returns structured validation errors before touching D1", async () => {
    const db = createFakeAiD1()
    const repository = createD1AiInteractionRepository(db)

    const result = await repository.createInteraction({
      ...baseInput,
      retrievalSources: [],
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [{ code: "AI_MISSING_RETRIEVAL_SOURCE" }],
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
