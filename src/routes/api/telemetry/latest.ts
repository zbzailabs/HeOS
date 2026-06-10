import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import {
  getDemoTelemetryLatest,
  parseTelemetryLatestQuery,
} from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/telemetry/latest")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const parsed = parseTelemetryLatestQuery(url.searchParams)

        if (!parsed.ok) {
          return json(
            { traceId: parsed.traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        const result = getDemoTelemetryLatest(parsed.value, parsed.traceId)

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
