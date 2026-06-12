import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { defaultCoreTenantId } from "../../../domain/core/api"
import {
  checkProductionWriteAccess,
  productionWriteActions,
} from "../../../domain/rbac/production-write-auth"
import { createTraceId } from "../../../domain/telemetry/api"
import { createD1TraceDetailRepository } from "../../../domain/trace/detail"
import type { TraceDetailD1Database } from "../../../domain/trace/detail"
import {
  createTraceExportAuditInsertPlan,
  createTraceExportJsonPayload,
  createTraceExportPlan,
  createTraceExportR2PutPlan,
  createTraceExportRefAppendPlan,
} from "../../../domain/trace/export-plan"
import { readCurrentAccessContext } from "../../../lib/access"

type TraceExportD1Database = TraceDetailD1Database & {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>
      run(): Promise<unknown>
    }
  }
}

type TraceExportR2Bucket = {
  put(
    key: string,
    value: string,
    options: { httpMetadata: { contentType: string } },
  ): Promise<unknown>
}

export const Route = createFileRoute("/api/core/trace-exports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const traceId = createTraceId("trace-export")
        const now = new Date().toISOString()
        const parsed = parseTraceExportBody(await request.json())

        if (!parsed.ok) {
          return json({ traceId, errors: parsed.errors }, { status: 400 })
        }

        const access = checkProductionWriteAccess({
          context: await readCurrentAccessContext(request),
          tenantId: parsed.value.tenantId,
          action: productionWriteActions.TRACE_ARCHIVE_EXPORT,
        })

        if (!access.allowed) {
          return json({ traceId, errors: access.errors }, { status: access.status })
        }

        const bindings = env as {
          HEOS_DB?: TraceExportD1Database
          HEOS_EXPORTS?: TraceExportR2Bucket
        }

        if (!bindings.HEOS_DB || !bindings.HEOS_EXPORTS) {
          return json(
            {
              traceId,
              errors: [
                {
                  code: "TRACE_EXPORT_BINDING_NOT_CONFIGURED",
                  message: "HEOS_DB and HEOS_EXPORTS bindings are required.",
                },
              ],
            },
            { status: 503 },
          )
        }

        const detail = await createD1TraceDetailRepository(
          bindings.HEOS_DB,
        ).getPublicTraceDetail({
          tenantId: parsed.value.tenantId,
          slug: parsed.value.publicSlug,
        })

        if (!detail) {
          return json(
            {
              traceId,
              errors: [
                {
                  code: "TRACE_ARCHIVE_NOT_FOUND",
                  message: "Public trace archive was not found.",
                },
              ],
            },
            { status: 404 },
          )
        }

        const exportPlan = createTraceExportPlan({
          tenantId: parsed.value.tenantId,
          traceArchiveId: detail.id,
          publicSlug: detail.publicSlug,
          format: parsed.value.format,
          generatedAt: now,
        })

        if (!exportPlan.ok) {
          return json({ traceId, errors: exportPlan.errors }, { status: 400 })
        }

        const payload = createTraceExportJsonPayload({
          traceId,
          generatedAt: now,
          detail,
          plan: exportPlan.value,
        })
        const putPlan = createTraceExportR2PutPlan(payload, exportPlan.value)
        await bindings.HEOS_EXPORTS.put(putPlan.key, putPlan.body, {
          httpMetadata: { contentType: putPlan.contentType },
        })

        const existingRefsJson = await readTraceExportRefs(
          bindings.HEOS_DB,
          parsed.value.tenantId,
          detail.id,
        )
        const appendPlan = createTraceExportRefAppendPlan({
          tenantId: parsed.value.tenantId,
          traceArchiveId: detail.id,
          existingRefsJson,
          generatedAt: now,
          plan: exportPlan.value,
        })
        await bindings.HEOS_DB
          .prepare(appendPlan.sql)
          .bind(...appendPlan.parameters)
          .run()

        const auditPlan = createTraceExportAuditInsertPlan({
          traceId,
          tenantId: parsed.value.tenantId,
          userId: access.userId,
          traceArchiveId: detail.id,
          objectRef: exportPlan.value.objectRef,
          createdAt: now,
          requestPath: "/api/core/trace-exports",
        })
        await bindings.HEOS_DB
          .prepare(auditPlan.sql)
          .bind(...auditPlan.parameters)
          .run()

        return json(
          {
            traceId,
            data: {
              traceArchiveId: detail.id,
              format: parsed.value.format,
              objectKey: exportPlan.value.objectKey,
              objectRef: exportPlan.value.objectRef,
              contentType: putPlan.contentType,
              generatedAt: now,
              auditAction: exportPlan.value.auditAction,
            },
          },
          { status: 200 },
        )
      },
    },
  },
})

function parseTraceExportBody(body: unknown):
  | {
      ok: true
      value: {
        tenantId: string
        publicSlug: string
        format: "json"
      }
    }
  | {
      ok: false
      errors: { code: string; message: string }[]
    } {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: [{ code: "INVALID_BODY", message: "JSON body is required." }],
    }
  }

  const publicSlug = readString(body.publicSlug)
  const format = readString(body.format) ?? "json"

  if (!publicSlug) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_TRACE_EXPORT",
          message: "publicSlug is required.",
        },
      ],
    }
  }

  if (format !== "json") {
    return {
      ok: false,
      errors: [
        {
          code: "TRACE_EXPORT_JSON_ONLY",
          message: "Only json trace export is implemented in S4-17.",
        },
      ],
    }
  }

  return {
    ok: true,
    value: {
      tenantId: readString(body.tenantId) ?? defaultCoreTenantId,
      publicSlug,
      format,
    },
  }
}

async function readTraceExportRefs(
  db: TraceExportD1Database,
  tenantId: string,
  traceArchiveId: string,
) {
  const result = await db
    .prepare(
      `SELECT exported_asset_refs_json
FROM heos_trace_archives
WHERE tenant_id = ? AND id = ?
LIMIT 1`,
    )
    .bind(tenantId, traceArchiveId)
    .all<{ exported_asset_refs_json: string }>()

  return result.results?.[0]?.exported_asset_refs_json ?? "[]"
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
