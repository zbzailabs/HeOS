import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import {
  handleAiInteractionPost,
  type AiInteractionPostBody,
} from "../../../domain/ai/api"
import type { AiD1Database } from "../../../domain/ai/d1-repository"
import { createTraceId } from "../../../domain/telemetry/api"
import { handleCoreApiRequest } from "../../../lib/core-api"

export const Route = createFileRoute("/api/core/ai-interactions")({
  server: {
    handlers: {
      GET: ({ request }) => handleCoreApiRequest("aiInteractions", request),
      POST: async ({ request }) => {
        const traceId = createTraceId("ai")
        const result = await handleAiInteractionPost({
          body: await request.json(),
          db: (env as { HEOS_DB?: AiD1Database }).HEOS_DB,
          deepSeekApiKey: (env as { DEEPSEEK_API_KEY?: string })
            .DEEPSEEK_API_KEY,
          deepSeekBaseUrl: (env as { DEEPSEEK_BASE_URL?: string })
            .DEEPSEEK_BASE_URL,
          deepSeekModel: (env as { DEEPSEEK_MODEL?: string }).DEEPSEEK_MODEL,
          traceId,
          now: new Date().toISOString(),
        })

        return json<AiInteractionPostBody>(result.body, {
          status: result.status,
        })
      },
    },
  },
})
