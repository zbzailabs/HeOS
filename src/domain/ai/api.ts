import { defaultCoreTenantId } from "../core/api"
import {
  aiScenarios,
  type AiInteractionResult,
  type AiInteractionValidationError,
  type AiInteractionWritePlanInput,
  type AiRetrievalSource,
  type AiScenario,
} from "./interaction"
import {
  createD1AiInteractionRepository,
  type AiD1Database,
  type AiD1WriteSummary,
} from "./d1-repository"

export type AiInteractionPostBody =
  | {
      traceId: string
      data: AiD1WriteSummary
    }
  | {
      traceId: string
      errors: (
        | AiInteractionValidationError
        | {
            code: string
            message: string
          }
      )[]
    }

export type AiInteractionPostResult = {
  status: number
  body: AiInteractionPostBody
}

export async function handleAiInteractionPost(input: {
  body: unknown
  db?: AiD1Database
  traceId: string
  now: string
}): Promise<AiInteractionPostResult> {
  if (!input.db) {
    return {
      status: 503,
      body: {
        traceId: input.traceId,
        errors: [
          {
            code: "HEOS_DB_NOT_CONFIGURED",
            message: "HEOS_DB binding is required for AI interaction writes.",
          },
        ],
      },
    }
  }

  const parsed = parseAiInteractionPostBody(input.body, input.traceId, input.now)
  if (!parsed.ok) {
    return {
      status: 400,
      body: {
        traceId: input.traceId,
        errors: parsed.errors,
      },
    }
  }

  const writeResult = await createD1AiInteractionRepository(input.db)
    .createInteraction(parsed.value)
  if (!writeResult.ok) {
    return {
      status: 400,
      body: {
        traceId: input.traceId,
        errors: writeResult.errors,
      },
    }
  }

  return {
    status: 200,
    body: {
      traceId: input.traceId,
      data: writeResult.value,
    },
  }
}

export function parseAiInteractionPostBody(
  body: unknown,
  traceId: string,
  now: string,
): AiInteractionResult<AiInteractionWritePlanInput> {
  if (!isRecord(body)) {
    return invalidBody("JSON object body is required.")
  }

  const scenario = readScenario(body.scenario)
  if (!scenario) {
    return invalidBody("scenario is required.")
  }

  return {
    ok: true,
    status: 200,
    value: {
      traceId,
      tenantId: readString(body.tenantId) ?? defaultCoreTenantId,
      userId: readString(body.userId) ?? "user-tenglong-admin",
      scenario,
      modelName: readString(body.modelName) ?? "manual-review",
      inputSummary: readString(body.inputSummary) ?? "",
      outputSummary: readString(body.outputSummary) ?? "",
      retrievalSources: readRetrievalSources(body.retrievalSources),
      costCents: readNumber(body.costCents) ?? 0,
      humanConfirmationRequired: body.humanConfirmationRequired === true,
      createdAt: now,
    },
  }
}

function invalidBody(message: string): AiInteractionResult<AiInteractionWritePlanInput> {
  return {
    ok: false,
    status: 400,
    errors: [
      {
        status: 400,
        code: "AI_INVALID_BODY",
        message,
        details: {},
      },
    ],
  }
}

function readRetrievalSources(value: unknown): AiRetrievalSource[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((source) => ({
    tenantId: readString(source.tenantId) ?? "",
    table: readString(source.table) ?? "",
    targetId: readString(source.targetId) ?? "",
    title: readString(source.title) ?? "",
    permissionCode: readString(source.permissionCode) ?? "",
  }))
}

function readScenario(value: unknown): AiScenario | null {
  return Object.values(aiScenarios).includes(value as AiScenario)
    ? (value as AiScenario)
    : null
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
