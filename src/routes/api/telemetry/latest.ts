import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import {
  getDemoTelemetryLatest,
  parseTelemetryLatestQuery,
} from "../../../domain/telemetry/api"
import {
  getD1TelemetryLatest,
  type TelemetryLatestD1Database,
} from "../../../domain/telemetry/d1-api"

export const Route = createFileRoute("/api/telemetry/latest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = parseTelemetryLatestQuery(url.searchParams)

        if (!parsed.ok) {
          return json(
            { traceId: parsed.traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        const d1Result = await getD1TelemetryLatest({
          db: (env as { HEOS_DB?: TelemetryLatestD1Database }).HEOS_DB,
          query: parsed.value,
          traceId: parsed.traceId,
        })
        const result =
          d1Result ?? getDemoTelemetryLatest(parsed.value, parsed.traceId)

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
