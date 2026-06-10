import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/project")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("projectDetail", request),
    },
  },
})
