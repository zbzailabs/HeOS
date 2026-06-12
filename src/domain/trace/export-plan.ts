import { auditActions } from "../audit/log"
import type { PublicTraceDetail } from "./detail"

const supportedFormats = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json",
} as const

export type TraceExportFormat = keyof typeof supportedFormats

export type TraceExportPlan = {
  bucketBinding: "HEOS_EXPORTS"
  auditAction: typeof auditActions.TRACE_EXPORT
  objectKey: string
  objectRef: string
  contentType: (typeof supportedFormats)[TraceExportFormat]
}

export type TraceExportJsonPayload = {
  traceId: string
  generatedAt: string
  traceArchive: PublicTraceDetail
  export: {
    format: "json"
    objectKey: string
    objectRef: string
    contentType: "application/json; charset=utf-8"
  }
}

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

export function createTraceExportJsonPayload(input: {
  traceId: string
  generatedAt: string
  detail: PublicTraceDetail
  plan: TraceExportPlan
}): TraceExportJsonPayload {
  return {
    traceId: input.traceId,
    generatedAt: input.generatedAt,
    traceArchive: input.detail,
    export: {
      format: "json",
      objectKey: input.plan.objectKey,
      objectRef: input.plan.objectRef,
      contentType: "application/json; charset=utf-8",
    },
  }
}

export function createTraceExportR2PutPlan(
  payload: TraceExportJsonPayload,
  plan: TraceExportPlan,
) {
  return {
    bucketBinding: plan.bucketBinding,
    key: plan.objectKey,
    body: JSON.stringify(payload, null, 2),
    contentType: "application/json; charset=utf-8",
  }
}

export function createTraceExportRefAppendPlan(input: {
  tenantId: string
  traceArchiveId: string
  existingRefsJson: string | null | undefined
  generatedAt: string
  plan: TraceExportPlan
}) {
  const existingRefs = readObjectArray(input.existingRefsJson)
  const nextRefs = [
    ...existingRefs,
    {
      format: "json",
      objectKey: input.plan.objectKey,
      objectRef: input.plan.objectRef,
      contentType: "application/json; charset=utf-8",
      generatedAt: input.generatedAt,
    },
  ]

  return {
    sql: `UPDATE heos_trace_archives
SET exported_asset_refs_json = ?, updated_at = ?
WHERE tenant_id = ? AND id = ?`,
    parameters: [
      JSON.stringify(nextRefs),
      input.generatedAt,
      input.tenantId,
      input.traceArchiveId,
    ],
  }
}

export function createTraceExportAuditInsertPlan(input: {
  traceId: string
  tenantId: string
  userId: string | null
  traceArchiveId: string
  objectRef: string
  createdAt: string
  requestPath: string
}) {
  return {
    sql: `INSERT INTO heos_audit_logs (
  id,
  trace_id,
  tenant_id,
  user_id,
  event_type,
  action,
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
    parameters: [
      createStableKey([
        "audit",
        input.traceId,
        auditActions.TRACE_EXPORT,
        input.createdAt,
      ]),
      input.traceId,
      input.tenantId,
      input.userId,
      auditActions.TRACE_EXPORT,
      auditActions.TRACE_EXPORT,
      "heos_trace_archives",
      input.traceArchiveId,
      input.objectRef,
      "success",
      null,
      0,
      "heos-api",
      "POST",
      input.requestPath,
      JSON.stringify({ objectRef: input.objectRef }),
      input.createdAt,
    ],
  }
}

function isTraceExportFormat(value: string): value is TraceExportFormat {
  return value in supportedFormats
}

function readObjectArray(value: string | null | undefined) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
      : []
  } catch {
    return []
  }
}

function createStableKey(parts: readonly string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("|")
}
