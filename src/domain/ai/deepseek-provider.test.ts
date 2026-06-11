import { describe, expect, it } from "vitest"

import { createDeepSeekDraftProvider } from "./deepseek-provider"

describe("DeepSeek draft provider", () => {
  it("calls DeepSeek chat completions with server-only bearer auth", async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const nowValues = [1000, 1123]
    const provider = createDeepSeekDraftProvider({
      apiKey: "deepseek-test-key",
      now: () => nowValues.shift() ?? 1123,
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "请复核设备状态。" } }],
            usage: { total_tokens: 12 },
          }),
          { status: 200 },
        )
      },
    })

    const result = await provider.generateDraft({
      scenario: "alert_explanation",
      sourceTitle: "soil_ph critical 告警",
      sourceSummary: "pH=9",
    })

    expect(result).toEqual({
      ok: true,
      value: {
        modelName: "deepseek-v4-flash",
        outputSummary: "请复核设备状态。",
        costCents: 0,
        providerMetric: {
          provider: "deepseek",
          modelName: "deepseek-v4-flash",
          status: "success",
          statusCode: 200,
          latencyMs: 123,
          totalTokens: 12,
          failureCode: null,
        },
      },
    })
    expect(calls[0]?.url).toBe("https://api.deepseek.com/chat/completions")
    expect(calls[0]?.init.method).toBe("POST")
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer deepseek-test-key",
      "content-type": "application/json",
    })
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({
      model: "deepseek-v4-flash",
      stream: false,
      messages: [
        { role: "system" },
        {
          role: "user",
          content: expect.stringContaining("soil_ph critical 告警"),
        },
      ],
    })
  })

  it("returns 503 before fetch when the API key is missing", async () => {
    const provider = createDeepSeekDraftProvider({
      apiKey: "",
      fetch: async () => {
        throw new Error("fetch must not run without a key")
      },
    })

    const result = await provider.generateDraft({
      scenario: "agri_advice",
      sourceTitle: "番茄苗期巡检",
      sourceSummary: "任务待执行",
    })

    expect(result).toEqual({
      ok: false,
      status: 503,
      errors: [
        {
          code: "DEEPSEEK_API_KEY_MISSING",
          message: "DEEPSEEK_API_KEY is required for AI draft generation.",
        },
      ],
    })
  })

  it("rejects unsafe DeepSeek draft content before returning success", async () => {
    const provider = createDeepSeekDraftProvider({
      apiKey: "deepseek-test-key",
      fetch: async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "立即打开水泵并修改控制阈值。" } }],
          }),
          { status: 200 },
        ),
    })

    const result = await provider.generateDraft({
      scenario: "alert_explanation",
      sourceTitle: "soil_ph critical 告警",
      sourceSummary: "pH=9",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [{ code: "AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN" }],
    })
  })

  it("returns provider metrics for failed DeepSeek requests", async () => {
    const nowValues = [2000, 2075]
    const provider = createDeepSeekDraftProvider({
      apiKey: "deepseek-test-key",
      now: () => nowValues.shift() ?? 2075,
      fetch: async () =>
        new Response(JSON.stringify({ error: "rate limited" }), { status: 429 }),
    })

    const result = await provider.generateDraft({
      scenario: "alert_explanation",
      sourceTitle: "soil_ph critical 告警",
      sourceSummary: "pH=9",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      errors: [{ code: "DEEPSEEK_REQUEST_FAILED" }],
      providerMetric: {
        provider: "deepseek",
        modelName: "deepseek-v4-flash",
        status: "failure",
        statusCode: 429,
        latencyMs: 75,
        totalTokens: 0,
        failureCode: "DEEPSEEK_REQUEST_FAILED",
      },
    })
  })
})
