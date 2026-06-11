import { describe, expect, it } from "vitest"

import {
  createAiProviderMetric,
  summarizeAiProviderMetrics,
} from "./observability"

describe("AI provider observability", () => {
  it("creates provider metrics with bounded numeric values", () => {
    const metric = createAiProviderMetric({
      provider: "deepseek",
      modelName: "deepseek-v4-flash",
      status: "success",
      statusCode: 200,
      latencyMs: 123.4,
      totalTokens: 16,
      failureCode: null,
      createdAt: "2026-06-11T12:00:00.000Z",
    })

    expect(metric).toEqual({
      provider: "deepseek",
      modelName: "deepseek-v4-flash",
      status: "success",
      statusCode: 200,
      latencyMs: 123,
      totalTokens: 16,
      failureCode: null,
      createdAt: "2026-06-11T12:00:00.000Z",
    })
  })

  it("summarizes request counts, latency, tokens, and latest failure", () => {
    const summary = summarizeAiProviderMetrics([
      createAiProviderMetric({
        provider: "deepseek",
        modelName: "deepseek-v4-flash",
        status: "success",
        statusCode: 200,
        latencyMs: 100,
        totalTokens: 10,
        failureCode: null,
        createdAt: "2026-06-11T12:00:00.000Z",
      }),
      createAiProviderMetric({
        provider: "deepseek",
        modelName: "deepseek-v4-flash",
        status: "failure",
        statusCode: 429,
        latencyMs: 300,
        totalTokens: 0,
        failureCode: "DEEPSEEK_REQUEST_FAILED",
        createdAt: "2026-06-11T12:01:00.000Z",
      }),
    ])

    expect(summary).toEqual({
      totalRequests: 2,
      successCount: 1,
      failureCount: 1,
      averageLatencyMs: 200,
      totalTokens: 10,
      latestFailureCode: "DEEPSEEK_REQUEST_FAILED",
    })
  })
})
