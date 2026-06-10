import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/devices")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("devices", request),
    },
  },
})
