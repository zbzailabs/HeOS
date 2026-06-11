import {
  createAiInteractionWritePlan,
  type AiInteractionResult,
  type AiInteractionWritePlanInput,
} from "./interaction"

export type AiD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
    }
  }
}

export type AiD1WriteSummary = {
  interactionId: string
  auditLogId: string
  writes: {
    auditLog: 1
    aiInteraction: 1
  }
}

export function createD1AiInteractionRepository(db: AiD1Database) {
  return {
    async createInteraction(
      input: AiInteractionWritePlanInput,
    ): Promise<AiInteractionResult<AiD1WriteSummary>> {
      const plan = createAiInteractionWritePlan(input)
      if (!plan.ok) {
        return plan
      }

      const auditLog = plan.value.auditLog.record
      await db
        .prepare(
          `INSERT INTO heos_audit_logs (
            id,
            trace_id,
            tenant_id,
            user_id,
            action,
            event_type,
            target_type,
            target_id,
            target_name,
            result,
            result_reason,
            latency_ms,
            source,
            request_method,
            request_path,
            metadata_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          auditLog.id,
          auditLog.traceId,
          auditLog.tenantId,
          auditLog.userId,
          auditLog.action,
          auditLog.eventType,
          auditLog.targetType,
          auditLog.targetId,
          auditLog.targetName,
          auditLog.result,
          auditLog.resultReason,
          auditLog.latencyMs,
          auditLog.source,
          auditLog.requestMethod,
          auditLog.requestPath,
          auditLog.metadataJson,
          auditLog.createdAt,
        )
        .run()

      const interaction = plan.value.aiInteraction.record
      await db
        .prepare(
          `INSERT INTO heos_ai_interactions (
            id,
            trace_id,
            tenant_id,
            user_id,
            scenario,
            model_name,
            input_summary,
            retrieval_sources_json,
            output_summary,
            cost_cents,
            human_confirmation_required,
            audit_log_id,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          interaction.id,
          interaction.traceId,
          interaction.tenantId,
          interaction.userId,
          interaction.scenario,
          interaction.modelName,
          interaction.inputSummary,
          interaction.retrievalSourcesJson,
          interaction.outputSummary,
          interaction.costCents,
          interaction.humanConfirmationRequired,
          interaction.auditLogId,
          interaction.createdAt,
        )
        .run()

      return {
        ok: true,
        status: 200,
        value: {
          interactionId: interaction.id,
          auditLogId: auditLog.id,
          writes: {
            auditLog: 1,
            aiInteraction: 1,
          },
        },
      }
    },
  }
}
