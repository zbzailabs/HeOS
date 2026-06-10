export const productionAuditActions = {
  ALERT_STATUS_UPDATE: "alert.status.update",
  AGRI_TASK_STATUS_UPDATE: "agri_task.status.update",
} as const

export type ProductionAlertStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "closed"

export type ProductionAgriTaskStatus = "planned" | "doing" | "done"

export type AgriTaskAcceptanceResult = "pending" | "accepted" | "rejected"

export type ProductionD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>
    }
  }
}

export function createD1ProductionActionRepository(db: ProductionD1Database) {
  return {
    async transitionAlert(input: {
      tenantId: string
      alertId: string
      nextStatus: ProductionAlertStatus
      userId: string
      now: string
      traceId: string
      note?: string | null
    }) {
      const acknowledgedBy =
        input.nextStatus === "acknowledged" ? input.userId : null
      const acknowledgedAt =
        input.nextStatus === "acknowledged" ? input.now : null
      const resolvedAt = input.nextStatus === "resolved" ? input.now : null
      const closedAt = input.nextStatus === "closed" ? input.now : null
      const recoveryRecordJson =
        input.nextStatus === "resolved" || input.nextStatus === "closed"
          ? JSON.stringify({
              note: input.note ?? null,
              userId: input.userId,
              recordedAt: input.now,
            })
          : null

      await db
        .prepare(
          `UPDATE heos_alerts
           SET status = ?,
             acknowledged_by_user_id = COALESCE(?, acknowledged_by_user_id),
             acknowledged_at = COALESCE(?, acknowledged_at),
             resolved_at = COALESCE(?, resolved_at),
             closed_at = COALESCE(?, closed_at),
             recovery_record_json = COALESCE(?, recovery_record_json),
             updated_at = ?
           WHERE tenant_id = ? AND id = ?`,
        )
        .bind(
          input.nextStatus,
          acknowledgedBy,
          acknowledgedAt,
          resolvedAt,
          closedAt,
          recoveryRecordJson,
          input.now,
          input.tenantId,
          input.alertId,
        )
        .run()

      await writeAuditLog(db, {
        traceId: input.traceId,
        tenantId: input.tenantId,
        userId: input.userId,
        action: productionAuditActions.ALERT_STATUS_UPDATE,
        targetType: "heos_alerts",
        targetId: input.alertId,
        targetName: input.nextStatus,
        resultReason: input.note ?? null,
        now: input.now,
      })

      return {
        alertWrites: 1,
        auditWrites: 1,
        nextStatus: input.nextStatus,
      }
    },

    async transitionAgriTask(input: {
      tenantId: string
      taskId: string
      cropCycleId: string
      nextStatus: ProductionAgriTaskStatus
      userId: string
      now: string
      traceId: string
      notes?: string | null
      acceptanceResult?: AgriTaskAcceptanceResult
      photoAssetRefs?: readonly string[]
    }) {
      await db
        .prepare(
          `UPDATE heos_agri_tasks
           SET status = ?, updated_at = ?
           WHERE tenant_id = ? AND id = ?`,
        )
        .bind(input.nextStatus, input.now, input.tenantId, input.taskId)
        .run()

      const recordId = createStableId(["agri-record", input.taskId, input.now])
      await db
        .prepare(
          `INSERT INTO heos_agri_task_records (
            id,
            tenant_id,
            agri_task_id,
            executed_by_user_id,
            executed_at,
            location_json,
            photo_asset_refs_json,
            input_materials_json,
            labor_json,
            machinery_json,
            acceptance_result,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          recordId,
          input.tenantId,
          input.taskId,
          input.userId,
          input.now,
          null,
          JSON.stringify(input.photoAssetRefs ?? []),
          "[]",
          "[]",
          "[]",
          input.acceptanceResult ?? "pending",
          input.notes ?? null,
        )
        .run()

      let traceArchiveWrites = 0
      if (input.nextStatus === "done") {
        await db
          .prepare(
            `INSERT INTO heos_trace_archives (
              id,
              tenant_id,
              crop_cycle_id,
              public_slug,
              visibility,
              agri_task_record_ids_json,
              input_materials_json,
              inspection_records_json,
              harvest_records_json,
              flow_records_json,
              public_payload_json,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (tenant_id, public_slug) DO UPDATE SET
              visibility = excluded.visibility,
              agri_task_record_ids_json = excluded.agri_task_record_ids_json,
              inspection_records_json = excluded.inspection_records_json,
              public_payload_json = excluded.public_payload_json,
              updated_at = excluded.updated_at`,
          )
          .bind(
            createStableId(["trace", input.cropCycleId]),
            input.tenantId,
            input.cropCycleId,
            input.cropCycleId,
            "public",
            JSON.stringify([recordId]),
            "[]",
            JSON.stringify([input.notes ?? "农事任务已完成。"]),
            "[]",
            JSON.stringify([
              {
                taskId: input.taskId,
                status: input.nextStatus,
                operatedAt: input.now,
              },
            ]),
            JSON.stringify({
              inspectionSummary: [input.notes ?? "农事任务已完成。"],
              lastTaskId: input.taskId,
              lastStatus: input.nextStatus,
            }),
            input.now,
          )
          .run()
        traceArchiveWrites = 1
      }

      await writeAuditLog(db, {
        traceId: input.traceId,
        tenantId: input.tenantId,
        userId: input.userId,
        action: productionAuditActions.AGRI_TASK_STATUS_UPDATE,
        targetType: "heos_agri_tasks",
        targetId: input.taskId,
        targetName: input.nextStatus,
        resultReason: input.notes ?? null,
        now: input.now,
      })

      return {
        taskWrites: 1,
        recordWrites: 1,
        auditWrites: 1,
        traceArchiveWrites,
        nextStatus: input.nextStatus,
      }
    },
  }
}

async function writeAuditLog(
  db: ProductionD1Database,
  input: {
    traceId: string
    tenantId: string
    userId: string
    action: string
    targetType: string
    targetId: string
    targetName: string
    resultReason: string | null
    now: string
  },
) {
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
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, 0, 'heos-api', ?, ?)`,
    )
    .bind(
      createStableId(["audit", input.traceId, input.action, input.targetId]),
      input.traceId,
      input.tenantId,
      input.userId,
      input.action,
      input.action,
      input.targetType,
      input.targetId,
      input.targetName,
      input.resultReason,
      JSON.stringify({ targetName: input.targetName }),
      input.now,
    )
    .run()
}

function createStableId(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
