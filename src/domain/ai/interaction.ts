import {
  auditActions,
  auditEventTypes,
  auditResults,
  createAuditLogWritePlan,
  type AuditLogWritePlan,
} from "../audit/log"

export const aiScenarios = {
  CROP_QA: "crop_qa",
  STAGE_ADVICE: "stage_advice",
  ALERT_EXPLANATION: "alert_explanation",
  AGRI_ADVICE: "agri_advice",
  REPORT_SUMMARY: "report_summary",
} as const

export type AiScenario = (typeof aiScenarios)[keyof typeof aiScenarios]

export const aiAuditActions = {
  INTERACTION_CREATE: "ai.interaction.create",
} as const

export const aiTables = {
  interactions: "heos_ai_interactions",
} as const

export type AiRetrievalSource = {
  tenantId: string
  table: string
  targetId: string
  title: string
  permissionCode: string
}

export type AiInteractionWritePlanInput = {
  traceId: string
  tenantId: string
  userId: string | null
  scenario: AiScenario
  modelName: string
  inputSummary: string
  outputSummary: string
  retrievalSources: readonly AiRetrievalSource[]
  costCents: number
  humanConfirmationRequired: boolean
  createdAt: string
}

export type AiInteractionRecord = {
  id: string
  traceId: string
  tenantId: string
  userId: string | null
  scenario: AiScenario
  modelName: string
  inputSummary: string
  retrievalSourcesJson: string
  outputSummary: string
  costCents: number
  humanConfirmationRequired: 0 | 1
  auditLogId: string
  createdAt: string
}

export type AiInteractionWritePlan = {
  aiInteraction: {
    table: typeof aiTables.interactions
    record: AiInteractionRecord
  }
  auditLog: AuditLogWritePlan
}

export const aiInteractionErrorCodes = {
  MISSING_RETRIEVAL_SOURCE: "AI_MISSING_RETRIEVAL_SOURCE",
  UNAUTHORIZED_RETRIEVAL_SOURCE: "AI_UNAUTHORIZED_RETRIEVAL_SOURCE",
  HUMAN_CONFIRMATION_REQUIRED: "AI_HUMAN_CONFIRMATION_REQUIRED",
  INVALID_COST: "AI_INVALID_COST",
} as const

export type AiInteractionValidationError = {
  status: 400
  code: (typeof aiInteractionErrorCodes)[keyof typeof aiInteractionErrorCodes]
  message: string
  details: Record<string, number | string | boolean>
}

export type AiInteractionResult<T> =
  | {
      ok: true
      status: 200
      value: T
    }
  | {
      ok: false
      status: 400
      errors: AiInteractionValidationError[]
    }

const highRiskScenarios = new Set<AiScenario>([
  aiScenarios.ALERT_EXPLANATION,
  aiScenarios.AGRI_ADVICE,
  aiScenarios.REPORT_SUMMARY,
])

export function createAiInteractionWritePlan(
  input: AiInteractionWritePlanInput,
): AiInteractionResult<AiInteractionWritePlan> {
  const errors = validateAiInteractionInput(input)
  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    }
  }

  const interactionId = createStableKey([
    "ai-interaction",
    input.traceId,
    input.scenario,
    input.createdAt,
  ])
  const metadataJson = JSON.stringify({
    scenario: input.scenario,
    modelName: input.modelName,
    retrievalSourceCount: input.retrievalSources.length,
    humanConfirmationRequired: input.humanConfirmationRequired,
  })
  const auditResult = createAuditLogWritePlan({
    traceId: input.traceId,
    tenantId: input.tenantId,
    userId: input.userId,
    eventType: auditEventTypes.AI_INTERACTION_CREATE,
    action: auditActions.AI_INTERACTION_CREATE,
    targetType: aiTables.interactions,
    targetId: interactionId,
    targetName: input.scenario,
    result: auditResults.SUCCESS,
    latencyMs: 0,
    source: "heos-ai",
    metadataJson,
    createdAt: input.createdAt,
  })

  if (!auditResult.ok) {
    return {
      ok: false,
      status: 400,
      errors: auditResult.errors.map((error) => ({
        status: 400,
        code: aiInteractionErrorCodes.INVALID_COST,
        message: error.message,
        details: error.details,
      })),
    }
  }

  return {
    ok: true,
    status: 200,
    value: {
      aiInteraction: {
        table: aiTables.interactions,
        record: {
          id: interactionId,
          traceId: input.traceId,
          tenantId: input.tenantId,
          userId: input.userId,
          scenario: input.scenario,
          modelName: input.modelName,
          inputSummary: input.inputSummary,
          retrievalSourcesJson: JSON.stringify(input.retrievalSources),
          outputSummary: input.outputSummary,
          costCents: input.costCents,
          humanConfirmationRequired: input.humanConfirmationRequired ? 1 : 0,
          auditLogId: auditResult.value.record.id,
          createdAt: input.createdAt,
        },
      },
      auditLog: auditResult.value,
    },
  }
}

function validateAiInteractionInput(
  input: AiInteractionWritePlanInput,
): AiInteractionValidationError[] {
  const errors: AiInteractionValidationError[] = []

  if (input.retrievalSources.length === 0) {
    errors.push({
      status: 400,
      code: aiInteractionErrorCodes.MISSING_RETRIEVAL_SOURCE,
      message: "AI interactions require at least one authorized retrieval source.",
      details: {
        tenantId: input.tenantId,
      },
    })
  }

  for (const retrievalSource of input.retrievalSources) {
    if (retrievalSource.tenantId !== input.tenantId) {
      errors.push({
        status: 400,
        code: aiInteractionErrorCodes.UNAUTHORIZED_RETRIEVAL_SOURCE,
        message: "AI retrieval source tenant must match the request tenant.",
        details: {
          tenantId: input.tenantId,
          sourceTenantId: retrievalSource.tenantId,
          targetId: retrievalSource.targetId,
        },
      })
    }
  }

  if (
    highRiskScenarios.has(input.scenario) &&
    !input.humanConfirmationRequired
  ) {
    errors.push({
      status: 400,
      code: aiInteractionErrorCodes.HUMAN_CONFIRMATION_REQUIRED,
      message: "High-risk AI scenarios require human confirmation.",
      details: {
        scenario: input.scenario,
      },
    })
  }

  if (!Number.isFinite(input.costCents) || input.costCents < 0) {
    errors.push({
      status: 400,
      code: aiInteractionErrorCodes.INVALID_COST,
      message: "AI interaction costCents must be a non-negative number.",
      details: {
        costCents: input.costCents,
      },
    })
  }

  return errors
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
