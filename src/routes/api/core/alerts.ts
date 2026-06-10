import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/alerts")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("alerts", request),
    },
  },
})
