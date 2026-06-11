import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import {
  getDemoTelemetryHistory,
  parseTelemetryHistoryQuery,
} from "../../../domain/telemetry/api"
import {
  createD1TelemetryQueryRepository,
  type TelemetryD1Database,
} from "../../../domain/telemetry/d1-query"

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

        const d1Result = await getD1TelemetryHistory(parsed.value)
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

async function getD1TelemetryHistory(
  query: Parameters<
    ReturnType<typeof createD1TelemetryQueryRepository>["getHistory"]
  >[0],
) {
  const db = (env as { HEOS_DB?: TelemetryD1Database }).HEOS_DB

  if (!db) {
    return null
  }

  const value = await createD1TelemetryQueryRepository(db)
    .getHistory(query)
    .catch(() => null)

  if (!value || value.items.length === 0) {
    return null
  }

  return {
    ok: true,
    status: 200,
    traceId: "telemetry_d1_history",
    value,
  } as const
}
