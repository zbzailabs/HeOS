import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import {
  getDemoTelemetryHistory,
  parseTelemetryHistoryQuery,
} from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/telemetry/history")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const parsed = parseTelemetryHistoryQuery(url.searchParams)

        if (!parsed.ok) {
          return json(
            { traceId: parsed.traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        const result = getDemoTelemetryHistory(parsed.value, parsed.traceId)

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
