import { describe, expect, it } from "vitest"

import { createD1AiProviderMetricRepository } from "./metrics-d1-repository"
import type { AiProviderMetric } from "./observability"

const metric = {
  provider: "deepseek",
  modelName: "deepseek-v4-flash",
  status: "failure",
  statusCode: 503,
  latencyMs: 1280,
  totalTokens: 0,
  failureCode: "DEEPSEEK_REQUEST_FAILED",
  createdAt: "2026-06-11T15:20:00.000Z",
} as const satisfies AiProviderMetric

describe("D1 AI provider metric repository", () => {
  it("writes provider metrics with stable ids and bounded numeric fields", async () => {
    const db = createFakeAiMetricD1()
    const result = await createD1AiProviderMetricRepository(db).createMetric({
      traceId: "trace-ai-metric-001",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: null,
      metric,
    })

    expect(result).toEqual({
      metricId:
        "ai-provider-metric|trace-ai-metric-001|deepseek|2026-06-11T15%3A20%3A00.000Z",
      writes: {
        providerMetric: 1,
      },
    })
    expect(db.statements).toHaveLength(1)
    expect(db.statements[0]?.sql).toContain(
      "INSERT INTO heos_ai_provider_metrics",
    )
    expect(db.statements[0]?.values).toEqual([
      "ai-provider-metric|trace-ai-metric-001|deepseek|2026-06-11T15%3A20%3A00.000Z",
      "trace-ai-metric-001",
      "tenant-tenglong-school",
      "user-tenglong-admin",
      null,
      "deepseek",
      "deepseek-v4-flash",
      "failure",
      503,
      1280,
      0,
      "DEEPSEEK_REQUEST_FAILED",
      "2026-06-11T15:20:00.000Z",
    ])
  })
})

function createFakeAiMetricD1() {
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
