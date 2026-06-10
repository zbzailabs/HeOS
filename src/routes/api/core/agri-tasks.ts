import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { defaultCoreTenantId } from "../../../domain/core/api"
import {
  createD1ProductionActionRepository,
  type AgriTaskAcceptanceResult,
  type ProductionAgriTaskStatus,
  type ProductionD1Database,
} from "../../../domain/production/actions"
import { createTraceId } from "../../../domain/telemetry/api"
import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/agri-tasks")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("agriTasks", request),
      POST: async ({ request }) => {
        const traceId = createTraceId("agri")
        const db = (env as { HEOS_DB?: ProductionD1Database }).HEOS_DB

        if (!db) {
          return json(
            {
              traceId,
              errors: [
                {
                  code: "HEOS_DB_NOT_CONFIGURED",
                  message: "HEOS_DB binding is required for agri task actions.",
                },
              ],
            },
            { status: 503 },
          )
        }

        const body = await request.json()
        const parsed = parseAgriTaskActionBody(body)

        if (!parsed.ok) {
          return json({ traceId, errors: parsed.errors }, { status: 400 })
        }

        const result =
          await createD1ProductionActionRepository(db).transitionAgriTask({
            tenantId: parsed.value.tenantId,
            taskId: parsed.value.taskId,
            cropCycleId: parsed.value.cropCycleId,
            nextStatus: parsed.value.nextStatus,
            userId: parsed.value.userId,
            now: new Date().toISOString(),
            traceId,
            notes: parsed.value.notes,
            acceptanceResult: parsed.value.acceptanceResult,
            photoAssetRefs: parsed.value.photoAssetRefs,
          })

        return json({ traceId, data: result }, { status: 200 })
      },
    },
  },
})

function parseAgriTaskActionBody(body: unknown):
  | {
      ok: true
      value: {
        tenantId: string
        taskId: string
        cropCycleId: string
        nextStatus: ProductionAgriTaskStatus
        userId: string
        notes: string | null
        acceptanceResult: AgriTaskAcceptanceResult
        photoAssetRefs: string[]
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

  const taskId = readString(body.taskId)
  const cropCycleId = readString(body.cropCycleId)
  const nextStatus = readAgriTaskStatus(body.status)

  if (!taskId || !cropCycleId || !nextStatus) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_AGRI_TASK_ACTION",
          message: "taskId, cropCycleId and status are required.",
        },
      ],
    }
  }

  return {
    ok: true,
    value: {
      tenantId: readString(body.tenantId) ?? defaultCoreTenantId,
      taskId,
      cropCycleId,
      nextStatus,
      userId: readString(body.userId) ?? "user-tenglong-admin",
      notes: readString(body.notes),
      acceptanceResult: readAcceptanceResult(body.acceptanceResult),
      photoAssetRefs: readStringArray(body.photoAssetRefs),
    },
  }
}

function readAgriTaskStatus(value: unknown): ProductionAgriTaskStatus | null {
  return value === "planned" || value === "doing" || value === "done"
    ? value
    : null
}

function readAcceptanceResult(value: unknown): AgriTaskAcceptanceResult {
  return value === "accepted" || value === "rejected" ? value : "pending"
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
