export type AiProviderMetricStatus = "success" | "failure"

export type AiProviderMetric = {
  provider: string
  modelName: string
  status: AiProviderMetricStatus
  statusCode: number | null
  latencyMs: number
  totalTokens: number
  failureCode: string | null
  createdAt: string
}

export type AiProviderMetricInput = {
  provider: string
  modelName: string
  status: AiProviderMetricStatus
  statusCode: number | null
  latencyMs: number
  totalTokens: number
  failureCode: string | null
  createdAt: string
}

export type AiProviderMetricSummary = {
  totalRequests: number
  successCount: number
  failureCount: number
  averageLatencyMs: number
  totalTokens: number
  latestFailureCode: string | null
}

export function createAiProviderMetric(
  input: AiProviderMetricInput,
): AiProviderMetric {
  return {
    provider: input.provider,
    modelName: input.modelName,
    status: input.status,
    statusCode: input.statusCode,
    latencyMs: toBoundedInteger(input.latencyMs),
    totalTokens: toBoundedInteger(input.totalTokens),
    failureCode: input.failureCode,
    createdAt: input.createdAt,
  }
}

export function summarizeAiProviderMetrics(
  metrics: AiProviderMetric[],
): AiProviderMetricSummary {
  const totalRequests = metrics.length
  const successCount = metrics.filter((metric) => metric.status === "success")
    .length
  const failureCount = totalRequests - successCount
  const totalLatencyMs = metrics.reduce(
    (sum, metric) => sum + metric.latencyMs,
    0,
  )
  const totalTokens = metrics.reduce((sum, metric) => sum + metric.totalTokens, 0)
  const latestFailure = [...metrics]
    .reverse()
    .find((metric) => metric.status === "failure")

  return {
    totalRequests,
    successCount,
    failureCount,
    averageLatencyMs:
      totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
    totalTokens,
    latestFailureCode: latestFailure?.failureCode ?? null,
  }
}

function toBoundedInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.round(value))
}
