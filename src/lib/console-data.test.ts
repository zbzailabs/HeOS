import { describe, expect, it } from "vitest"

import { readAiProviderOperations } from "./console-data"

describe("console D1 AI provider operations", () => {
  it("summarizes provider metrics from the last 24 hours for the console AI panel", async () => {
    const db = createFakeD1([
      {
        status: "success",
        latency_ms: 300,
        total_tokens: 1200,
        failure_code: null,
        created_at: "2026-06-11T16:00:00.000Z",
      },
      {
        status: "failure",
        latency_ms: 900,
        total_tokens: 0,
        failure_code: "DEEPSEEK_REQUEST_FAILED",
        created_at: "2026-06-11T15:59:00.000Z",
      },
    ])

    const operations = await readAiProviderOperations(
      db,
      "tenant-tenglong-school",
      new Date("2026-06-11T16:30:00.000Z"),
    )

    expect(db.sql).toContain("FROM heos_ai_provider_metrics")
    expect(db.sql).toContain("created_at >= ?")
    expect(db.values).toEqual([
      "tenant-tenglong-school",
      "2026-06-10T16:30:00.000Z",
    ])
    expect(operations).toEqual({
      recentProviderCalls: 2,
      recentProviderFailures: 1,
      averageLatencyMs: 600,
      totalTokens: 1200,
      latestFailureCode: "DEEPSEEK_REQUEST_FAILED",
      metricsWindowHours: 24,
      metricsUpdatedAt: "2026-06-11T16:00:00.000Z",
    })
  })

  it("keeps a stable 24 hour summary when no provider metrics are present", async () => {
    const db = createFakeD1([])

    const operations = await readAiProviderOperations(
      db,
      "tenant-tenglong-school",
      new Date("2026-06-11T16:30:00.000Z"),
    )

    expect(operations).toEqual({
      recentProviderCalls: 0,
      recentProviderFailures: 0,
      averageLatencyMs: null,
      totalTokens: 0,
      latestFailureCode: null,
      metricsWindowHours: 24,
      metricsUpdatedAt: null,
    })
  })
})

function createFakeD1(
  results: {
    status: string
    latency_ms: number | null
    total_tokens: number | null
    failure_code: string | null
    created_at: string
  }[],
) {
  return {
    sql: "",
    values: [] as unknown[],
    prepare(sql: string) {
      this.sql = sql

      return {
        bind: (...values: unknown[]) => {
          this.values = values

          return {
            all: async () => ({ results }),
          }
        },
      }
    },
  }
}
