import { auditActions } from "../audit/log"

const supportedFormats = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json",
} as const

export type TraceExportFormat = keyof typeof supportedFormats

export function createTraceExportPlan(input: {
  tenantId: string
  traceArchiveId: string
  publicSlug: string
  format: string
  generatedAt: string
}) {
  if (!isTraceExportFormat(input.format)) {
    return {
      ok: false as const,
      errors: [
        {
          code: "UNSUPPORTED_TRACE_EXPORT_FORMAT",
          message: "Trace export format must be pdf, docx, xlsx, or json.",
        },
      ],
    }
  }

  const timestamp = input.generatedAt.replaceAll(/[-:.]/g, "")
  const objectKey = [
    input.tenantId,
    "trace",
    input.publicSlug,
    input.format,
    `${input.traceArchiveId}-${timestamp}.${input.format}`,
  ].join("/")

  return {
    ok: true as const,
    value: {
      bucketBinding: "HEOS_EXPORTS",
      auditAction: auditActions.TRACE_EXPORT,
      objectKey,
      objectRef: `r2://heos-exports/${objectKey}`,
      contentType: supportedFormats[input.format],
    },
  }
}

function isTraceExportFormat(value: string): value is TraceExportFormat {
  return value in supportedFormats
}
