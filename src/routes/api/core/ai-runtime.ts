import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"

import {
  createTanStackAiSseStream,
  parseTanStackAiRuntimeRequest,
} from "../../../domain/ai/tanstack-runtime"
import { createTraceId } from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/core/ai-runtime")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const traceId = createTraceId("tanstack-ai")
        const parsed = parseTanStackAiRuntimeRequest(await request.json(), {
          traceId,
          now: new Date().toISOString(),
        })

        if (!parsed.ok) {
          return json(
            { traceId, errors: parsed.errors },
            { status: parsed.status },
          )
        }

        return createTanStackAiSseStream(parsed.value)
      },
    },
  },
})
