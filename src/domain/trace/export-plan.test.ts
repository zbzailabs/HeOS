import { describe, expect, test } from "vitest"

import {
  createTraceExportAuditInsertPlan,
  createTraceExportJsonPayload,
  createTraceExportPlan,
  createTraceExportR2PutPlan,
  createTraceExportRefAppendPlan,
} from "./export-plan"

describe("trace export plan", () => {
  test("creates stable R2 object references for supported export formats", () => {
    const plan = createTraceExportPlan({
      tenantId: "tenant-tenglong-school",
      traceArchiveId: "trace-tenglong-lettuce-2026-summer",
      publicSlug: "tlxx-lettuce-2026-summer",
      format: "pdf",
      generatedAt: "2026-06-11T17:30:00.000Z",
    })

    expect(plan).toEqual({
      ok: true,
      value: {
        bucketBinding: "HEOS_EXPORTS",
        auditAction: "trace.export",
        objectKey:
          "tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/pdf/trace-tenglong-lettuce-2026-summer-20260611T173000000Z.pdf",
        objectRef:
          "r2://heos-exports/tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/pdf/trace-tenglong-lettuce-2026-summer-20260611T173000000Z.pdf",
        contentType: "application/pdf",
      },
    })
  })

  test("rejects unsupported export formats", () => {
    const plan = createTraceExportPlan({
      tenantId: "tenant-tenglong-school",
      traceArchiveId: "trace-tenglong-lettuce-2026-summer",
      publicSlug: "tlxx-lettuce-2026-summer",
      format: "png",
      generatedAt: "2026-06-11T17:30:00.000Z",
    })

    expect(plan).toEqual({
      ok: false,
      errors: [
        {
          code: "UNSUPPORTED_TRACE_EXPORT_FORMAT",
          message: "Trace export format must be pdf, docx, xlsx, or json.",
        },
      ],
    })
  })

  test("creates JSON payload, R2 put plan, D1 ref append and audit insert plans", () => {
    const exportPlan = createTraceExportPlan({
      tenantId: "tenant-tenglong-school",
      traceArchiveId: "trace-tenglong-lettuce-2026-summer",
      publicSlug: "tlxx-lettuce-2026-summer",
      format: "json",
      generatedAt: "2026-06-12T08:00:00.000Z",
    })

    expect(exportPlan.ok).toBe(true)
    if (!exportPlan.ok) {
      return
    }

    const payload = createTraceExportJsonPayload({
      traceId: "trace-export-001",
      generatedAt: "2026-06-12T08:00:00.000Z",
      plan: exportPlan.value,
      detail: {
        id: "trace-tenglong-lettuce-2026-summer",
        tenantId: "tenant-tenglong-school",
        cropCycleId: "crop-cycle-tenglong-lettuce-2026-summer",
        publicSlug: "tlxx-lettuce-2026-summer",
        visibility: "public",
        createdAt: "2026-06-10T00:00:00.000Z",
        projectName: "腾龙小学智慧农场",
        cropCycleName: "2026 夏季教学叶菜",
        inspectionSummary: ["叶色正常"],
        publicPayload: { crop: "教学叶菜" },
        agriRecords: [
          {
            id: "record-1",
            agriTaskId: "task-1",
            taskTitle: "苗期日常巡检",
            executedAt: "2026-06-11T09:00:00.000Z",
            acceptanceResult: "accepted",
            notes: "完成巡检。",
            photoAssetRefs: ["r2://heos/agri/daily-inspection.jpg"],
          },
        ],
      },
    })
    const r2Plan = createTraceExportR2PutPlan(payload, exportPlan.value)
    const appendPlan = createTraceExportRefAppendPlan({
      tenantId: "tenant-tenglong-school",
      traceArchiveId: "trace-tenglong-lettuce-2026-summer",
      existingRefsJson: "[]",
      generatedAt: "2026-06-12T08:00:00.000Z",
      plan: exportPlan.value,
    })
    const auditPlan = createTraceExportAuditInsertPlan({
      traceId: "trace-export-001",
      tenantId: "tenant-tenglong-school",
      userId: "admin@example.com",
      traceArchiveId: "trace-tenglong-lettuce-2026-summer",
      objectRef: exportPlan.value.objectRef,
      createdAt: "2026-06-12T08:00:00.000Z",
      requestPath: "/api/core/trace-exports",
    })

    expect(payload).toMatchObject({
      traceArchive: {
        id: "trace-tenglong-lettuce-2026-summer",
        projectName: "腾龙小学智慧农场",
      },
      export: {
        format: "json",
        objectRef:
          "r2://heos-exports/tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/json/trace-tenglong-lettuce-2026-summer-20260612T080000000Z.json",
      },
    })
    expect(r2Plan).toMatchObject({
      bucketBinding: "HEOS_EXPORTS",
      key:
        "tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/json/trace-tenglong-lettuce-2026-summer-20260612T080000000Z.json",
      contentType: "application/json; charset=utf-8",
    })
    expect(JSON.parse(r2Plan.body)).toMatchObject(payload)
    expect(appendPlan).toEqual({
      sql: `UPDATE heos_trace_archives
SET exported_asset_refs_json = ?, updated_at = ?
WHERE tenant_id = ? AND id = ?`,
      parameters: [
        JSON.stringify([
          {
            format: "json",
            objectKey: exportPlan.value.objectKey,
            objectRef: exportPlan.value.objectRef,
            contentType: "application/json; charset=utf-8",
            generatedAt: "2026-06-12T08:00:00.000Z",
          },
        ]),
        "2026-06-12T08:00:00.000Z",
        "tenant-tenglong-school",
        "trace-tenglong-lettuce-2026-summer",
      ],
    })
    expect(auditPlan.parameters).toEqual([
      "audit|trace-export-001|trace.export|2026-06-12T08%3A00%3A00.000Z",
      "trace-export-001",
      "tenant-tenglong-school",
      "admin@example.com",
      "trace.export",
      "trace.export",
      "heos_trace_archives",
      "trace-tenglong-lettuce-2026-summer",
      exportPlan.value.objectRef,
      "success",
      null,
      0,
      "heos-api",
      "POST",
      "/api/core/trace-exports",
      JSON.stringify({ objectRef: exportPlan.value.objectRef }),
      "2026-06-12T08:00:00.000Z",
    ])
  })
})
