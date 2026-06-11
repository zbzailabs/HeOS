import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import {
  getDemoTelemetryHistory,
  parseTelemetryHistoryQuery,
} from "../../../domain/telemetry/api"
import type { TelemetryD1Database } from "../../../domain/telemetry/d1-query"
import { getD1TelemetryHistory } from "../../../domain/telemetry/d1-api"

export const Route = createFileRoute("/api/telemetry/history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = parseTelemetryHistoryQuery(url.searchParams)

        if (!parsed.ok) {
          return json(
            { traceId: parsed.traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        const d1Result = await getD1TelemetryHistory({
          db: (env as { HEOS_DB?: TelemetryD1Database }).HEOS_DB,
          query: parsed.value,
          traceId: parsed.traceId,
        })
        const result =
          d1Result ?? getDemoTelemetryHistory(parsed.value, parsed.traceId)

        return json(
          result.ok
            ? { traceId: result.traceId, data: result.value }
            : { traceId: result.traceId, errors: result.errors },
          { status: result.status },
        )
      },
    },
  },
})
