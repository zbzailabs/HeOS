import type { AiScenario } from "./interaction"
import type { AiProviderMetric } from "./observability"
import { validateDeepSeekDraft } from "./deepseek-safety"

type DeepSeekProviderMetric = Omit<AiProviderMetric, "createdAt">

export type DeepSeekDraftProviderInput = {
  scenario: AiScenario | string
  sourceTitle: string
  sourceSummary: string
}

export type DeepSeekDraftProviderResult =
  | {
      ok: true
      value: {
        modelName: string
        outputSummary: string
        costCents: number
        providerMetric: DeepSeekProviderMetric
      }
    }
  | {
      ok: false
      status: 400 | 503
      errors: {
        code: string
        message: string
      }[]
      providerMetric?: DeepSeekProviderMetric
    }

export type DeepSeekDraftProviderOptions = {
  apiKey?: string
  baseUrl?: string
  model?: string
  fetch?: typeof fetch
  now?: () => number
}

const defaultDeepSeekBaseUrl = "https://api.deepseek.com"
const defaultDeepSeekModel = "deepseek-v4-flash"

export function createDeepSeekDraftProvider(
  options: DeepSeekDraftProviderOptions,
) {
  return {
    async generateDraft(
      input: DeepSeekDraftProviderInput,
    ): Promise<DeepSeekDraftProviderResult> {
      if (!options.apiKey) {
        return {
          ok: false,
          status: 503,
          errors: [
            {
              code: "DEEPSEEK_API_KEY_MISSING",
              message: "DEEPSEEK_API_KEY is required for AI draft generation.",
            },
          ],
        }
      }

      const model = options.model ?? defaultDeepSeekModel
      const fetchImpl = options.fetch ?? fetch
      const now = options.now ?? Date.now
      const startedAt = now()
      const response = await fetchImpl(
        `${options.baseUrl ?? defaultDeepSeekBaseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${options.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "你是 HeOS 农业生产管理平台的 AI 辅助服务。只基于授权来源生成简短建议，不触发设备控制。",
              },
              {
                role: "user",
                content: [
                  `场景：${input.scenario}`,
                  `授权来源：${input.sourceTitle}`,
                  `来源摘要：${input.sourceSummary}`,
                  "请输出一段可供人工复核的中文建议，控制在 80 字以内。",
                ].join("\n"),
              },
            ],
            thinking: { type: "disabled" },
            stream: false,
          }),
        },
      )
      const latencyMs = Math.max(0, Math.round(now() - startedAt))

      if (!response.ok) {
        return {
          ok: false,
          status: 503,
          errors: [
            {
              code: "DEEPSEEK_REQUEST_FAILED",
              message: `DeepSeek request failed with status ${response.status}.`,
            },
          ],
          providerMetric: {
            provider: "deepseek",
            modelName: model,
            status: "failure",
            statusCode: response.status,
            latencyMs,
            totalTokens: 0,
            failureCode: "DEEPSEEK_REQUEST_FAILED",
          },
        }
      }

      const body = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[]
        usage?: { total_tokens?: number | null }
      }
      const content = body.choices?.[0]?.message?.content?.trim()
      const totalTokens =
        typeof body.usage?.total_tokens === "number" &&
        Number.isFinite(body.usage.total_tokens)
          ? Math.max(0, Math.round(body.usage.total_tokens))
          : 0

      if (!content) {
        return {
          ok: false,
          status: 503,
          errors: [
            {
              code: "DEEPSEEK_EMPTY_RESPONSE",
              message: "DeepSeek returned an empty draft response.",
            },
          ],
          providerMetric: {
            provider: "deepseek",
            modelName: model,
            status: "failure",
            statusCode: response.status,
            latencyMs,
            totalTokens,
            failureCode: "DEEPSEEK_EMPTY_RESPONSE",
          },
        }
      }
      const safety = validateDeepSeekDraft(content)
      if (!safety.ok) {
        return {
          ok: false,
          status: 400,
          errors: safety.errors,
          providerMetric: {
            provider: "deepseek",
            modelName: model,
            status: "failure",
            statusCode: response.status,
            latencyMs,
            totalTokens,
            failureCode: safety.errors[0]?.code ?? "AI_OUTPUT_REJECTED",
          },
        }
      }

      return {
        ok: true,
        value: {
          modelName: model,
          outputSummary: safety.value,
          costCents: 0,
          providerMetric: {
            provider: "deepseek",
            modelName: model,
            status: "success",
            statusCode: response.status,
            latencyMs,
            totalTokens,
            failureCode: null,
          },
        },
      }
    },
  }
}
