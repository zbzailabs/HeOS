import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  auditActions,
  auditEventTypes,
  auditModelErrorCodes,
  auditResults,
  auditTables,
  createAuditLogRecord,
  createAuditLogWritePlan,
  createAuditQueryPlan,
  type AuditLogInput,
} from "./log"

const migrationSql = readFileSync(
  new URL(
    "../../../db/migrations/0005_heos_audit_standard_fields.sql",
    import.meta.url,
  ),
  "utf8",
)

const baseAuditInput = {
  traceId: "trace-001",
  tenantId: "tenant-1",
  userId: "user-1",
  eventType: auditEventTypes.TELEMETRY_QUERY,
  action: auditActions.TELEMETRY_QUERY,
  targetType: "telemetry",
  targetId: "rk-sensor-001",
  targetName: "一号棚土壤 pH",
  result: auditResults.SUCCESS,
  latencyMs: 42,
  source: "server-function",
  metadataJson: '{"metricCode":"soil_ph"}',
  createdAt: "2026-06-10T08:00:00.000Z",
} as const satisfies AuditLogInput

describe("audit log standard fields", () => {
  it("normalizes required standard fields with a stable id", () => {
    const record = createAuditLogRecord(baseAuditInput)
    const duplicate = createAuditLogRecord(baseAuditInput)
    const nextTrace = createAuditLogRecord({
      ...baseAuditInput,
      traceId: "trace-002",
    })

    expect(record).toMatchObject({
      traceId: "trace-001",
      tenantId: "tenant-1",
      userId: "user-1",
      eventType: auditEventTypes.TELEMETRY_QUERY,
      action: auditActions.TELEMETRY_QUERY,
      targetType: "telemetry",
      targetId: "rk-sensor-001",
      result: auditResults.SUCCESS,
      latencyMs: 42,
    })
    expect(record.id).toBe(duplicate.id)
    expect(record.id).not.toBe(nextTrace.id)
  })

  it("defines required event types for phase-one operations", () => {
    expect(Object.values(auditEventTypes)).toEqual([
      "auth.login",
      "trace.export",
      "telemetry.query",
      "device.control.request",
      "policy.change",
      "provider.sync",
    ])
  })

  it("rejects negative latency", () => {
    const result = createAuditLogWritePlan({
      ...baseAuditInput,
      latencyMs: -1,
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: auditModelErrorCodes.INVALID_LATENCY,
        },
      ],
    })
  })

  it("keeps failure reason when an operation fails", () => {
    const result = createAuditLogWritePlan({
      ...baseAuditInput,
      result: auditResults.FAILURE,
      resultReason: "SCHEMA_MISMATCH",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        table: auditTables.logs,
        record: {
          result: auditResults.FAILURE,
          resultReason: "SCHEMA_MISMATCH",
        },
      },
    })
  })

  it("builds a tenant, action, and time-window query plan", () => {
    const result = createAuditQueryPlan({
      tenantId: "tenant-1",
      action: auditActions.TELEMETRY_QUERY,
      fromTs: "2026-06-10T00:00:00.000Z",
      toTs: "2026-06-10T23:59:59.999Z",
      limit: 100,
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        table: auditTables.logs,
        where: [
          "tenant_id = ?",
          "action = ?",
          "created_at >= ?",
          "created_at <= ?",
        ],
        orderBy: ["created_at DESC", "id DESC"],
        limit: 100,
      },
    })
  })
})

describe("audit D1 migration", () => {
  it("extends audit logs with queryable standard fields", () => {
    expect(migrationSql).toContain("ALTER TABLE heos_audit_logs ADD COLUMN event_type TEXT")
    expect(migrationSql).toContain("ALTER TABLE heos_audit_logs ADD COLUMN target_name TEXT")
    expect(migrationSql).toContain("idx_heos_audit_logs_tenant_action_created")
    expect(migrationSql).toContain("idx_heos_audit_logs_user_created")
    expect(migrationSql).toContain("idx_heos_audit_logs_event_type_created")
  })
})
