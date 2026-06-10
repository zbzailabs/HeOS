import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"

import { createCoreApiHandlers } from "../../../domain/core/api"

const handlers = createCoreApiHandlers()

export const Route = createFileRoute("/api/core/trace-archives")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const result = handlers.traceArchives(url.searchParams)

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
