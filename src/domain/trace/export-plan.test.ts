import { describe, expect, test } from "vitest"

import { createTraceExportPlan } from "./export-plan"

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
})
