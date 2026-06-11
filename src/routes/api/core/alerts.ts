import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { createTraceId } from "../../../domain/telemetry/api"
import {
  checkProductionWriteAccess,
  productionWriteActions,
} from "../../../domain/rbac/production-write-auth"
import {
  createD1ProductionActionRepository,
  type ProductionAlertStatus,
  type ProductionD1Database,
} from "../../../domain/production/actions"
import { defaultCoreTenantId } from "../../../domain/core/api"
import { readCurrentAccessContext } from "../../../lib/access"
import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/alerts")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("alerts", request),
      POST: async ({ request }) => {
        const traceId = createTraceId("alert")
        const body = await request.json()
        const parsed = parseAlertActionBody(body)

        if (!parsed.ok) {
          return json({ traceId, errors: parsed.errors }, { status: 400 })
        }

        const access = checkProductionWriteAccess({
          context: await readCurrentAccessContext(request),
          tenantId: parsed.value.tenantId,
          action: productionWriteActions.ALERT_STATUS_UPDATE,
        })

        if (!access.allowed) {
          return json({ traceId, errors: access.errors }, { status: access.status })
        }

        const db = (env as { HEOS_DB?: ProductionD1Database }).HEOS_DB

        if (!db) {
          return json(
            {
              traceId,
              errors: [
                {
                  code: "HEOS_DB_NOT_CONFIGURED",
                  message: "HEOS_DB binding is required for alert actions.",
                },
              ],
            },
            { status: 503 },
          )
        }

        const result = await createD1ProductionActionRepository(db).transitionAlert(
          {
            tenantId: parsed.value.tenantId,
            alertId: parsed.value.alertId,
            nextStatus: parsed.value.nextStatus,
            userId: access.userId,
            now: new Date().toISOString(),
            traceId,
            note: parsed.value.note,
          },
        )

        return json({ traceId, data: result }, { status: 200 })
      },
    },
  },
})

function parseAlertActionBody(body: unknown):
  | {
      ok: true
      value: {
        tenantId: string
        alertId: string
        nextStatus: ProductionAlertStatus
        userId: string
        note: string | null
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

  const alertId = readString(body.alertId)
  const nextStatus = readAlertStatus(body.status)
  const userId = readString(body.userId) ?? "user-tenglong-admin"

  if (!alertId || !nextStatus) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_ALERT_ACTION",
          message: "alertId and status are required.",
        },
      ],
    }
  }

  return {
    ok: true,
    value: {
      tenantId: readString(body.tenantId) ?? defaultCoreTenantId,
      alertId,
      nextStatus,
      userId,
      note: readString(body.note),
    },
  }
}

function readAlertStatus(value: unknown): ProductionAlertStatus | null {
  return value === "open" ||
    value === "acknowledged" ||
    value === "resolved" ||
    value === "closed"
    ? value
    : null
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
