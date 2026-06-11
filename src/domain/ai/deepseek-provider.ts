import type { AiScenario } from "./interaction"

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
      }
    }
  | {
      ok: false
      status: 503
      errors: {
        code: string
        message: string
      }[]
    }

export type DeepSeekDraftProviderOptions = {
  apiKey?: string
  baseUrl?: string
  model?: string
  fetch?: typeof fetch
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
        }
      }

      const body = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[]
      }
      const content = body.choices?.[0]?.message?.content?.trim()

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
        }
      }

      return {
        ok: true,
        value: {
          modelName: model,
          outputSummary: content,
          costCents: 0,
        },
      }
    },
  }
}
