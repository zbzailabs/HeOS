import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { defaultCoreTenantId } from "../../../domain/core/api"
import {
  createOperationsHealthSnapshot,
  type OperationsHealthD1Database,
} from "../../../domain/operations/health"
import { createTraceId } from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/operations/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const traceId = createTraceId("ops-health")
        const url = new URL(request.url)
        const tenantId = url.searchParams.get("tenantId") ?? defaultCoreTenantId
        const db = (env as { HEOS_DB?: OperationsHealthD1Database }).HEOS_DB

        if (!db) {
          return json(
            {
              traceId,
              status: "degraded",
              errors: [
                {
                  code: "HEOS_DB_NOT_CONFIGURED",
                  message: "HEOS_DB binding is required for operations health.",
                },
              ],
            },
            { status: 503 },
          )
        }

        const snapshot = await createOperationsHealthSnapshot({
          db,
          tenantId,
        })

        return json({ traceId, ...snapshot }, { status: 200 })
      },
    },
  },
})
