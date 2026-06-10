import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/ai-interactions")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("aiInteractions", request),
    },
  },
})
