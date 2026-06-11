import {
  createAiProviderMetric,
  type AiProviderMetric,
  type AiProviderMetricInput,
} from "./observability"

export type AiProviderMetricD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
    }
  }
}

export type AiProviderMetricD1Input = {
  traceId: string
  tenantId: string
  userId: string | null
  interactionId: string | null
  metric: AiProviderMetricInput
}

export type AiProviderMetricD1WriteSummary = {
  metricId: string
  writes: {
    providerMetric: 1
  }
}

export function createD1AiProviderMetricRepository(
  db: AiProviderMetricD1Database,
) {
  return {
    async createMetric(
      input: AiProviderMetricD1Input,
    ): Promise<AiProviderMetricD1WriteSummary> {
      const metric = createAiProviderMetric(input.metric)
      const metricId = createAiProviderMetricId(input.traceId, metric)

      await db
        .prepare(
          `INSERT INTO heos_ai_provider_metrics (
            id,
            trace_id,
            tenant_id,
            user_id,
            interaction_id,
            provider,
            model_name,
            status,
            status_code,
            latency_ms,
            total_tokens,
            failure_code,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          metricId,
          input.traceId,
          input.tenantId,
          input.userId,
          input.interactionId,
          metric.provider,
          metric.modelName,
          metric.status,
          metric.statusCode,
          metric.latencyMs,
          metric.totalTokens,
          metric.failureCode,
          metric.createdAt,
        )
        .run()

      return {
        metricId,
        writes: {
          providerMetric: 1,
        },
      }
    },
  }
}

function createAiProviderMetricId(traceId: string, metric: AiProviderMetric) {
  return [
    "ai-provider-metric",
    traceId,
    metric.provider,
    encodeURIComponent(metric.createdAt),
  ].join("|")
}
