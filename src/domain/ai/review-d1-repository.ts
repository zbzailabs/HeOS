import {
  createAiReviewActionPlan,
  type AiReviewActionPlanInput,
  type AiReviewResult,
} from "./review"

export type AiReviewD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
    }
  }
}

export type AiReviewD1WriteSummary = {
  reviewActionId: string
  statusAfterAction: string
  writes: {
    reviewAction: 1
  }
}

export function createD1AiReviewRepository(db: AiReviewD1Database) {
  return {
    async createReviewAction(
      input: AiReviewActionPlanInput,
    ): Promise<AiReviewResult<AiReviewD1WriteSummary>> {
      const plan = createAiReviewActionPlan(input)
      if (!plan.ok) {
        return plan
      }

      const review = plan.value.reviewAction.record
      await db
        .prepare(
          `INSERT INTO heos_ai_review_actions (
            id,
            trace_id,
            tenant_id,
            user_id,
            interaction_id,
            action,
            status_after_action,
            note,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          review.id,
          review.traceId,
          review.tenantId,
          review.userId,
          review.interactionId,
          review.action,
          review.statusAfterAction,
          review.note,
          review.createdAt,
        )
        .run()

      return {
        ok: true,
        status: 200,
        value: {
          reviewActionId: review.id,
          statusAfterAction: review.statusAfterAction,
          writes: {
            reviewAction: 1,
          },
        },
      }
    },
  }
}
