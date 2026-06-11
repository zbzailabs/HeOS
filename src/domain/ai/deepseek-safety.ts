export type DeepSeekDraftSafetyResult =
  | {
      ok: true
      value: string
    }
  | {
      ok: false
      errors: {
        code: string
        message: string
      }[]
    }

const maxDraftChars = 160
const maxDraftBytes = 240

const forbiddenControlPhrases = [
  "打开水泵",
  "关闭水泵",
  "下发控制",
  "修改控制阈值",
  "修改阈值",
  "自动执行",
] as const

const textEncoder = new TextEncoder()

export function validateDeepSeekDraft(value: string): DeepSeekDraftSafetyResult {
  const trimmed = value.trim()

  if (!trimmed) {
    return {
      ok: false,
      errors: [
        {
          code: "AI_OUTPUT_EMPTY",
          message: "DeepSeek draft output is empty.",
        },
      ],
    }
  }

  const matchedPhrase = forbiddenControlPhrases.find((phrase) =>
    trimmed.includes(phrase),
  )
  if (matchedPhrase) {
    return {
      ok: false,
      errors: [
        {
          code: "AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN",
          message: `DeepSeek draft output contains forbidden device control phrase: ${matchedPhrase}.`,
        },
      ],
    }
  }

  return {
    ok: true,
    value: trimToMaxBytes(trimmed.slice(0, maxDraftChars), maxDraftBytes),
  }
}

function trimToMaxBytes(value: string, maxBytes: number) {
  let result = ""
  let byteLength = 0

  for (const char of value) {
    const charByteLength = textEncoder.encode(char).byteLength
    if (byteLength + charByteLength > maxBytes) {
      break
    }
    result += char
    byteLength += charByteLength
  }

  return result
}
