import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/trace-archives")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("traceArchives", request),
    },
  },
})
