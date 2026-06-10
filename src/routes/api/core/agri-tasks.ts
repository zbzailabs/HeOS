import { createFileRoute } from "@tanstack/react-router"

import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/agri-tasks")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("agriTasks", request),
    },
  },
})
