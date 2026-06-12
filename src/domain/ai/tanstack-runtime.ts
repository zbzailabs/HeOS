import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

import { defaultCoreTenantId } from "../core/api"
import { aiScenarios, type AiRetrievalSource, type AiScenario } from "./interaction"

export const tanStackAiProviders = {
  OPENAI: "openai",
  OPENROUTER: "openrouter",
} as const

export type TanStackAiProvider =
  (typeof tanStackAiProviders)[keyof typeof tanStackAiProviders]

export type TanStackAiRuntimeRequest = {
  traceId: string
  threadId: string
  runId: string
  tenantId: string
  userId: string
  scenario: AiScenario
  source: AiRetrievalSource
  provider: TanStackAiProvider
  providerAdapter: "@tanstack/ai-openai" | "@tanstack/ai-openrouter"
  modelName: "gpt-5.2" | "openrouter:auto"
  userMessage: string
  createdAt: string
  approval: {
    approvalId: string
    approved: boolean
    required: true
    toolName: "create_ai_review_draft"
  }
}

export type TanStackAiRuntimeSnapshot = {
  traceId: string
  threadId: string
  runId: string
  transport: "ag-ui-sse"
  gateway: "none"
  provider: {
    code: TanStackAiProvider
    adapter: TanStackAiRuntimeRequest["providerAdapter"]
    modelName: TanStackAiRuntimeRequest["modelName"]
  }
  runtimeState: {
    status: "approval_required" | "streaming"
    observable: true
    hostSideMcp: "available"
    lazyToolDiscovery: "available"
  }
  structuredOutput: {
    schemaName: "HeosAiDraft"
    partial: {
      scenario: AiScenario
      sourceTitle: string
      recommendation: string
      humanConfirmationRequired: true
    }
  }
  tools: {
    boundary: "server" | "client"
    name: string
    needsApproval: boolean
    state: "approved" | "approval_required" | "available"
  }[]
  media: {
    image: "available-through-provider"
    audio: "available-through-provider"
    video: "available-through-provider"
    realtimeVoice: "token-required"
  }
}

type ParseResult =
  | {
      ok: true
      status: 200
      value: TanStackAiRuntimeRequest
    }
  | {
      ok: false
      status: 400
      errors: { code: string; message: string }[]
    }

export const heosAiDraftSchema = z.object({
  scenario: z.enum([
    aiScenarios.CROP_QA,
    aiScenarios.STAGE_ADVICE,
    aiScenarios.ALERT_EXPLANATION,
    aiScenarios.AGRI_ADVICE,
    aiScenarios.REPORT_SUMMARY,
  ]),
  sourceTitle: z.string(),
  recommendation: z.string(),
  humanConfirmationRequired: z.literal(true),
})

export const createAiReviewDraftTool = toolDefinition({
  name: "create_ai_review_draft",
  description: "生成 AI 建议草稿并进入人工确认队列。",
  inputSchema: z.object({
    tenantId: z.string(),
    scenario: heosAiDraftSchema.shape.scenario,
    source: z.object({
      tenantId: z.string(),
      table: z.string(),
      targetId: z.string(),
      title: z.string(),
      permissionCode: z.string(),
    }),
  }),
  outputSchema: heosAiDraftSchema,
  needsApproval: true,
}).server(async ({ scenario, source }) => ({
  scenario,
  sourceTitle: source.title,
  recommendation: createRuntimeRecommendation(scenario, source.title),
  humanConfirmationRequired: true,
}))

export const showAiRuntimeToastTool = toolDefinition({
  name: "show_ai_runtime_toast",
  description: "在控制台展示 AI 运行时状态。",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    displayed: z.boolean(),
  }),
}).client(async () => ({ displayed: true }))

export function parseTanStackAiRuntimeRequest(
  body: unknown,
  input: { traceId: string; now: string },
): ParseResult {
  if (!isRecord(body)) {
    return invalidRuntimeRequest("AG-UI RunAgentInput JSON object is required.")
  }

  const forwardedProps = isRecord(body.forwardedProps)
    ? body.forwardedProps
    : isRecord(body.data)
      ? body.data
      : {}
  const scenario = readScenario(forwardedProps.scenario)
  const source = readRetrievalSource(forwardedProps.source)
  const provider = readProvider(forwardedProps.provider)
  const threadId = readString(body.threadId) ?? `thread-${input.traceId}`
  const runId = readString(body.runId) ?? `run-${input.traceId}`

  if (!scenario || !source) {
    return invalidRuntimeRequest("scenario and source are required.")
  }

  return {
    ok: true,
    status: 200,
    value: {
      traceId: input.traceId,
      threadId,
      runId,
      tenantId: readString(forwardedProps.tenantId) ?? defaultCoreTenantId,
      userId: readString(forwardedProps.userId) ?? "user-tenglong-admin",
      scenario,
      source,
      provider,
      providerAdapter:
        provider === tanStackAiProviders.OPENAI
          ? "@tanstack/ai-openai"
          : "@tanstack/ai-openrouter",
      modelName:
        provider === tanStackAiProviders.OPENAI ? "gpt-5.2" : "openrouter:auto",
      userMessage: readLastUserMessage(body.messages),
      createdAt: input.now,
      approval: {
        approvalId: [
          "tool-approval",
          input.traceId,
          createAiReviewDraftTool.name,
          runId,
        ].join("|"),
        approved: forwardedProps.approveToolCall === true,
        required: true,
        toolName: createAiReviewDraftTool.name,
      },
    },
  }
}

export function createTanStackAiRuntimeSnapshot(
  input: TanStackAiRuntimeRequest,
): TanStackAiRuntimeSnapshot {
  const approvalState = input.approval.approved ? "approved" : "approval_required"

  return {
    traceId: input.traceId,
    threadId: input.threadId,
    runId: input.runId,
    transport: "ag-ui-sse",
    gateway: "none",
    provider: {
      code: input.provider,
      adapter: input.providerAdapter,
      modelName: input.modelName,
    },
    runtimeState: {
      status: input.approval.approved ? "streaming" : "approval_required",
      observable: true,
      hostSideMcp: "available",
      lazyToolDiscovery: "available",
    },
    structuredOutput: {
      schemaName: "HeosAiDraft",
      partial: {
        scenario: input.scenario,
        sourceTitle: input.source.title,
        recommendation: createRuntimeRecommendation(
          input.scenario,
          input.source.title,
        ),
        humanConfirmationRequired: true,
      },
    },
    tools: [
      {
        boundary: "server",
        name: createAiReviewDraftTool.name,
        needsApproval: true,
        state: approvalState,
      },
      {
        boundary: "client",
        name: showAiRuntimeToastTool.name,
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
  }
}

export async function createTanStackAiSseStream(
  input: TanStackAiRuntimeRequest,
): Promise<Response> {
  const snapshot = createTanStackAiRuntimeSnapshot(input)
  const events = [
    createSseEvent("RUN_STARTED", {
      threadId: input.threadId,
      runId: input.runId,
      traceId: input.traceId,
      provider: input.provider,
      adapter: input.providerAdapter,
      modelName: input.modelName,
      gateway: "none",
    }),
    input.approval.approved
      ? createSseEvent("TOOL_CALL_APPROVED", input.approval)
      : createSseEvent("TOOL_CALL_APPROVAL_REQUIRED", input.approval),
    createSseEvent("TEXT_MESSAGE_CONTENT", {
      threadId: input.threadId,
      runId: input.runId,
      role: "assistant",
      delta: snapshot.structuredOutput.partial.recommendation,
    }),
    createSseEvent("STRUCTURED_OUTPUT", snapshot.structuredOutput),
    createSseEvent("RUN_FINISHED", {
      threadId: input.threadId,
      runId: input.runId,
      traceId: input.traceId,
      status: snapshot.runtimeState.status,
      media: snapshot.media,
      tools: snapshot.tools,
    }),
  ].join("")

  return new Response(events, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      "x-heos-ai-runtime": "tanstack-ai",
      "x-trace-id": input.traceId,
    },
  })
}

function createRuntimeRecommendation(scenario: AiScenario, sourceTitle: string) {
  const scenarioLabels: Record<AiScenario, string> = {
    [aiScenarios.CROP_QA]: "作物问答",
    [aiScenarios.STAGE_ADVICE]: "阶段建议",
    [aiScenarios.ALERT_EXPLANATION]: "告警解释",
    [aiScenarios.AGRI_ADVICE]: "农事建议",
    [aiScenarios.REPORT_SUMMARY]: "报告摘要",
  }

  return `${scenarioLabels[scenario]}已基于 ${sourceTitle} 生成草稿，需人工确认后进入业务流程。`
}

function createSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function invalidRuntimeRequest(message: string): ParseResult {
  return {
    ok: false,
    status: 400,
    errors: [{ code: "AI_RUNTIME_INVALID_REQUEST", message }],
  }
}

function readLastUserMessage(messages: unknown) {
  if (!Array.isArray(messages)) {
    return ""
  }

  const last = [...messages].reverse().find((message) => {
    return isRecord(message) && message.role === "user"
  })

  return isRecord(last) ? (readString(last.content) ?? "") : ""
}

function readRetrievalSource(value: unknown): AiRetrievalSource | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    tenantId: readString(value.tenantId) ?? "",
    table: readString(value.table) ?? "",
    targetId: readString(value.targetId) ?? "",
    title: readString(value.title) ?? "",
    permissionCode: readString(value.permissionCode) ?? "",
  }
}

function readScenario(value: unknown): AiScenario | null {
  return Object.values(aiScenarios).includes(value as AiScenario)
    ? (value as AiScenario)
    : null
}

function readProvider(value: unknown): TanStackAiProvider {
  return value === tanStackAiProviders.OPENAI
    ? tanStackAiProviders.OPENAI
    : tanStackAiProviders.OPENROUTER
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
