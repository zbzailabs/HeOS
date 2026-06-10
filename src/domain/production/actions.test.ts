import { describe, expect, it } from "vitest"

import {
  createD1ProductionActionRepository,
  productionAuditActions,
} from "./actions"

describe("production D1 actions", () => {
  it("transitions alerts and writes an audit log", async () => {
    const db = createFakeD1ActionDatabase()
    const repository = createD1ProductionActionRepository(db)

    const result = await repository.transitionAlert({
      tenantId: "tenant-tenglong-school",
      alertId: "alert-offline-demo",
      nextStatus: "acknowledged",
      userId: "user-tenglong-admin",
      now: "2026-06-11T08:00:00.000Z",
      traceId: "trace-alert-action",
      note: "现场已确认设备状态。",
    })

    expect(result).toEqual({
      alertWrites: 1,
      auditWrites: 1,
      nextStatus: "acknowledged",
    })
    expect(db.tables.heos_alerts[0]).toMatchObject({
      id: "alert-offline-demo",
      status: "acknowledged",
      acknowledged_by_user_id: "user-tenglong-admin",
      acknowledged_at: "2026-06-11T08:00:00.000Z",
    })
    expect(db.tables.heos_audit_logs[0]).toMatchObject({
      trace_id: "trace-alert-action",
      action: productionAuditActions.ALERT_STATUS_UPDATE,
      target_id: "alert-offline-demo",
      result: "success",
    })
  })

  it("transitions agri tasks, records execution, and publishes trace archives", async () => {
    const db = createFakeD1ActionDatabase()
    const repository = createD1ProductionActionRepository(db)

    const result = await repository.transitionAgriTask({
      tenantId: "tenant-tenglong-school",
      taskId: "agri-task-tenglong-daily-inspection",
      cropCycleId: "crop-cycle-tenglong-lettuce-2026-summer",
      nextStatus: "done",
      userId: "user-tenglong-admin",
      now: "2026-06-11T09:00:00.000Z",
      traceId: "trace-agri-action",
      notes: "完成苗期巡检，验收通过。",
      acceptanceResult: "accepted",
      photoAssetRefs: ["r2://heos/agri/daily-inspection.jpg"],
    })

    expect(result).toEqual({
      taskWrites: 1,
      recordWrites: 1,
      auditWrites: 1,
      traceArchiveWrites: 1,
      nextStatus: "done",
    })
    expect(db.tables.heos_agri_tasks[0]).toMatchObject({
      id: "agri-task-tenglong-daily-inspection",
      status: "done",
    })
    expect(db.tables.heos_agri_task_records[0]).toMatchObject({
      agri_task_id: "agri-task-tenglong-daily-inspection",
      acceptance_result: "accepted",
      notes: "完成苗期巡检，验收通过。",
    })
    expect(db.tables.heos_trace_archives[0]).toMatchObject({
      crop_cycle_id: "crop-cycle-tenglong-lettuce-2026-summer",
      visibility: "public",
      public_slug: "crop-cycle-tenglong-lettuce-2026-summer",
    })
  })
})

function createFakeD1ActionDatabase() {
  const tables = {
    heos_alerts: [] as Record<string, unknown>[],
    heos_agri_tasks: [] as Record<string, unknown>[],
    heos_agri_task_records: [] as Record<string, unknown>[],
    heos_trace_archives: [] as Record<string, unknown>[],
    heos_audit_logs: [] as Record<string, unknown>[],
  }

  return {
    tables,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async run() {
              if (sql.startsWith("UPDATE heos_alerts")) {
                tables.heos_alerts.push({
                  status: values[0],
                  acknowledged_by_user_id: values[1],
                  acknowledged_at: values[2],
                  resolved_at: values[3],
                  closed_at: values[4],
                  recovery_record_json: values[5],
                  updated_at: values[6],
                  tenant_id: values[7],
                  id: values[8],
                })
              }

              if (sql.startsWith("UPDATE heos_agri_tasks")) {
                tables.heos_agri_tasks.push({
                  status: values[0],
                  updated_at: values[1],
                  tenant_id: values[2],
                  id: values[3],
                })
              }

              if (sql.includes("INTO heos_agri_task_records")) {
                tables.heos_agri_task_records.push({
                  id: values[0],
                  tenant_id: values[1],
                  agri_task_id: values[2],
                  executed_by_user_id: values[3],
                  executed_at: values[4],
                  photo_asset_refs_json: values[6],
                  acceptance_result: values[10],
                  notes: values[11],
                })
              }

              if (sql.includes("INTO heos_trace_archives")) {
                tables.heos_trace_archives.push({
                  id: values[0],
                  tenant_id: values[1],
                  crop_cycle_id: values[2],
                  public_slug: values[3],
                  visibility: values[4],
                  agri_task_record_ids_json: values[5],
                  public_payload_json: values[10],
                })
              }

              if (sql.includes("INTO heos_audit_logs")) {
                tables.heos_audit_logs.push({
                  id: values[0],
                  trace_id: values[1],
                  tenant_id: values[2],
                  user_id: values[3],
                  action: values[4],
                  event_type: values[5],
                  target_type: values[6],
                  target_id: values[7],
                  target_name: values[8],
                  result: "success",
                  result_reason: values[9],
                  source: "heos-api",
                })
              }

              return { success: true }
            },
          }
        },
      }
    },
  }
}
