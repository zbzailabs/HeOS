import { describe, expect, it } from "vitest"

import { validateDeepSeekDraft } from "./deepseek-safety"

describe("DeepSeek draft safety", () => {
  it("rejects direct device control instructions", () => {
    const result = validateDeepSeekDraft("立即打开水泵并修改控制阈值。")

    expect(result).toMatchObject({
      ok: false,
      errors: [{ code: "AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN" }],
    })
  })

  it("accepts concise review-only suggestions", () => {
    const result = validateDeepSeekDraft(
      "建议复核设备采样时间、阈值规则和现场供电状态。",
    )

    expect(result).toEqual({
      ok: true,
      value: "建议复核设备采样时间、阈值规则和现场供电状态。",
    })
  })
})
