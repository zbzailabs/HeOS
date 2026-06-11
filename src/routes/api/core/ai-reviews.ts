import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import {
  handleAiReviewPost,
  type AiReviewPostBody,
} from "../../../domain/ai/review-api"
import type { AiReviewD1Database } from "../../../domain/ai/review-d1-repository"
import { createTraceId } from "../../../domain/telemetry/api"
import { readCurrentAccessContext } from "../../../lib/access"

export const Route = createFileRoute("/api/core/ai-reviews")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const traceId = createTraceId("ai-review")
        const result = await handleAiReviewPost({
          body: await request.json(),
          db: (env as { HEOS_DB?: AiReviewD1Database }).HEOS_DB,
          accessContext: await readCurrentAccessContext(),
          traceId,
          now: new Date().toISOString(),
        })

        return json<AiReviewPostBody>(result.body, {
          status: result.status,
        })
      },
    },
  },
})
