export const aiReviewActions = {
  CONFIRM: "confirm",
  REJECT: "reject",
} as const

export type AiReviewAction =
  (typeof aiReviewActions)[keyof typeof aiReviewActions]

export const aiReviewStatuses = {
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
} as const

export type AiReviewStatus =
  (typeof aiReviewStatuses)[keyof typeof aiReviewStatuses]

export const aiReviewErrorCodes = {
  NOTE_REQUIRED: "AI_REVIEW_NOTE_REQUIRED",
  INTERACTION_REQUIRED: "AI_REVIEW_INTERACTION_REQUIRED",
  INVALID_ACTION: "AI_REVIEW_INVALID_ACTION",
} as const

export type AiReviewActionPlanInput = {
  traceId: string
  tenantId: string
  userId: string | null
  interactionId: string
  action: AiReviewAction | string
  note: string
  createdAt: string
}

export type AiReviewActionRecord = {
  id: string
  traceId: string
  tenantId: string
  userId: string | null
  interactionId: string
  action: AiReviewAction
  statusAfterAction: AiReviewStatus
  note: string
  createdAt: string
}

export type AiReviewActionPlan = {
  reviewAction: {
    table: "heos_ai_review_actions"
    record: AiReviewActionRecord
  }
}

export type AiReviewValidationError = {
  status: 400
  code: (typeof aiReviewErrorCodes)[keyof typeof aiReviewErrorCodes]
  message: string
  details: Record<string, string>
}

export type AiReviewResult<T> =
  | { ok: true; status: 200; value: T }
  | { ok: false; status: 400; errors: AiReviewValidationError[] }

export function createAiReviewActionPlan(
  input: AiReviewActionPlanInput,
): AiReviewResult<AiReviewActionPlan> {
  const errors = validateAiReviewAction(input)
  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    }
  }

  const action = input.action as AiReviewAction
  return {
    ok: true,
    status: 200,
    value: {
      reviewAction: {
        table: "heos_ai_review_actions",
        record: {
          id: createStableKey([
            "ai-review",
            input.traceId,
            input.interactionId,
            action,
            input.createdAt,
          ]),
          traceId: input.traceId,
          tenantId: input.tenantId,
          userId: input.userId,
          interactionId: input.interactionId,
          action,
          statusAfterAction:
            action === aiReviewActions.CONFIRM
              ? aiReviewStatuses.CONFIRMED
              : aiReviewStatuses.REJECTED,
          note: input.note.trim(),
          createdAt: input.createdAt,
        },
      },
    },
  }
}

function validateAiReviewAction(
  input: AiReviewActionPlanInput,
): AiReviewValidationError[] {
  const errors: AiReviewValidationError[] = []

  if (!input.interactionId) {
    errors.push({
      status: 400,
      code: aiReviewErrorCodes.INTERACTION_REQUIRED,
      message: "AI review requires an interactionId.",
      details: { param: "interactionId" },
    })
  }

  if (!input.note.trim()) {
    errors.push({
      status: 400,
      code: aiReviewErrorCodes.NOTE_REQUIRED,
      message: "AI review note is required.",
      details: { param: "note" },
    })
  }

  if (
    input.action !== aiReviewActions.CONFIRM &&
    input.action !== aiReviewActions.REJECT
  ) {
    errors.push({
      status: 400,
      code: aiReviewErrorCodes.INVALID_ACTION,
      message: "AI review action must be confirm or reject.",
      details: { param: "action" },
    })
  }

  return errors
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
