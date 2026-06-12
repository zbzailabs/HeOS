import { describe, expect, it } from "vitest"

import { aiScenarios } from "./interaction"
import {
  createTanStackAiRuntimeSnapshot,
  createTanStackAiSseStream,
  parseTanStackAiRuntimeRequest,
} from "./tanstack-runtime"

const requestBody = {
  threadId: "thread-tenglong-ai",
  runId: "run-tenglong-ai-001",
  state: { panel: "console-ai" },
  messages: [
    {
      id: "message-user-001",
      role: "user",
      content: "解释土壤 pH 告警，并给出人工复核建议。",
    },
  ],
  tools: [
    {
      name: "create_ai_review_draft",
      description: "生成 AI 建议草稿并进入人工确认队列。",
    },
  ],
  context: [],
  forwardedProps: {
    tenantId: "tenant-tenglong-school",
    userId: "user-tenglong-admin",
    scenario: aiScenarios.ALERT_EXPLANATION,
    provider: "openrouter",
    source: {
      tenantId: "tenant-tenglong-school",
      table: "heos_alerts",
      targetId: "alert-soil-ph-critical",
      title: "soil_ph critical 告警",
      permissionCode: "alert:read",
    },
    approveToolCall: false,
  },
  data: {},
}

describe("TanStack AI runtime", () => {
  it("parses AG-UI compatible request envelopes with provider portability", () => {
    const parsed = parseTanStackAiRuntimeRequest(requestBody, {
      traceId: "trace-tanstack-ai-001",
      now: "2026-06-12T09:00:00.000Z",
    })

    expect(parsed).toEqual({
      ok: true,
      status: 200,
      value: expect.objectContaining({
        threadId: "thread-tenglong-ai",
        runId: "run-tenglong-ai-001",
        provider: "openrouter",
        providerAdapter: "@tanstack/ai-openrouter",
        modelName: "openrouter:auto",
        approval: {
          approvalId:
            "tool-approval|trace-tanstack-ai-001|create_ai_review_draft|run-tenglong-ai-001",
          approved: false,
          required: true,
          toolName: "create_ai_review_draft",
        },
      }),
    })
  })

  it("returns a typed runtime snapshot for tools, structured output and media state", () => {
    const parsed = parseTanStackAiRuntimeRequest(
      {
        ...requestBody,
        forwardedProps: {
          ...requestBody.forwardedProps,
          provider: "openai",
          approveToolCall: true,
        },
      },
      {
        traceId: "trace-tanstack-ai-002",
        now: "2026-06-12T09:01:00.000Z",
      },
    )

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const snapshot = createTanStackAiRuntimeSnapshot(parsed.value)

    expect(snapshot).toMatchObject({
      traceId: "trace-tanstack-ai-002",
      transport: "ag-ui-sse",
      gateway: "none",
      provider: {
        adapter: "@tanstack/ai-openai",
        code: "openai",
        modelName: "gpt-5.2",
      },
      structuredOutput: {
        schemaName: "HeosAiDraft",
        partial: {
          scenario: aiScenarios.ALERT_EXPLANATION,
          sourceTitle: "soil_ph critical 告警",
        },
      },
      tools: [
        {
          boundary: "server",
          name: "create_ai_review_draft",
          needsApproval: true,
          state: "approved",
        },
        {
          boundary: "client",
          name: "show_ai_runtime_toast",
          needsApproval: false,
          state: "available",
        },
      ],
      media: {
        image: "available-through-provider",
        audio: "available-through-provider",
        video: "available-through-provider",
        realtimeVoice: "token-required",
      },
    })
  })

  it("streams AG-UI event names for approval, partial structured output and completion", async () => {
    const parsed = parseTanStackAiRuntimeRequest(requestBody, {
      traceId: "trace-tanstack-ai-003",
      now: "2026-06-12T09:02:00.000Z",
    })

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const stream = await createTanStackAiSseStream(parsed.value)
    const text = await stream.text()

    expect(text).toContain("event: RUN_STARTED")
    expect(text).toContain("event: TOOL_CALL_APPROVAL_REQUIRED")
    expect(text).toContain("event: TEXT_MESSAGE_CONTENT")
    expect(text).toContain("event: STRUCTURED_OUTPUT")
    expect(text).toContain("event: RUN_FINISHED")
    expect(text).toContain('"threadId":"thread-tenglong-ai"')
    expect(text).toContain('"provider":"openrouter"')
  })
})
