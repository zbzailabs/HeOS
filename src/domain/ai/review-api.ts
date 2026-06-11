import { defaultCoreTenantId } from "../core/api"
import type { AccessContext } from "../rbac/access-policy"
import {
  checkProductionWriteAccess,
  productionWriteActions,
} from "../rbac/production-write-auth"
import {
  createD1AiReviewRepository,
  type AiReviewD1Database,
  type AiReviewD1WriteSummary,
} from "./review-d1-repository"
import type { AiReviewValidationError } from "./review"

export type AiReviewPostBody =
  | {
      traceId: string
      data: AiReviewD1WriteSummary
    }
  | {
      traceId: string
      errors: (
        | AiReviewValidationError
        | {
            code: string
            message: string
          }
      )[]
    }

export type AiReviewPostResult = {
  status: number
  body: AiReviewPostBody
}

export async function handleAiReviewPost(input: {
  body: unknown
  db?: AiReviewD1Database
  accessContext: AccessContext | null
  traceId: string
  now: string
}): Promise<AiReviewPostResult> {
  if (!isRecord(input.body)) {
    return {
      status: 400,
      body: {
        traceId: input.traceId,
        errors: [
          {
            code: "AI_REVIEW_INVALID_BODY",
            message: "JSON object body is required.",
          },
        ],
      },
    }
  }

  const tenantId = readString(input.body.tenantId) ?? defaultCoreTenantId
  const access = checkProductionWriteAccess({
    context: input.accessContext,
    tenantId,
    action: productionWriteActions.AI_REVIEW,
  })

  if (!access.allowed) {
    return {
      status: access.status,
      body: {
        traceId: input.traceId,
        errors: access.errors,
      },
    }
  }

  if (!input.db) {
    return {
      status: 503,
      body: {
        traceId: input.traceId,
        errors: [
          {
            code: "HEOS_DB_NOT_CONFIGURED",
            message: "HEOS_DB binding is required for AI review writes.",
          },
        ],
      },
    }
  }

  const writeResult = await createD1AiReviewRepository(input.db)
    .createReviewAction({
      traceId: input.traceId,
      tenantId,
      userId: access.userId,
      interactionId: readString(input.body.interactionId) ?? "",
      action: readString(input.body.action) ?? "",
      note: readString(input.body.note) ?? "",
      createdAt: input.now,
    })

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

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
