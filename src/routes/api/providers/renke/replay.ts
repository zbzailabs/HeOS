import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"

import {
  createRenkeReplayPlan,
  createRenkeSyncQueueMessage,
} from "../../../../domain/renke/sync"
import { createTraceId } from "../../../../domain/telemetry/api"

type ReplayBody = {
  fromTs?: string
  toTs?: string
  attempt?: number
}

export const Route = createFileRoute("/api/providers/renke/replay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const traceId = createTraceId("renke_replay")
        const body = (await request.json().catch(() => ({}))) as ReplayBody
        const fromTs = body.fromTs ?? new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const toTs = body.toTs ?? new Date().toISOString()
        const replay = createRenkeReplayPlan({
          traceId,
          fromTs,
          toTs,
        })

        if (!replay.ok) {
          return json(
            {
              traceId,
              errors: [
                {
                  status: replay.status,
                  code: replay.code,
                  message: replay.message,
                },
              ],
            },
            { status: replay.status },
          )
        }

        return json(
          {
            traceId,
            data: {
              replay,
              queueMessage: createRenkeSyncQueueMessage({
                traceId,
                attempt: body.attempt ?? 1,
              }),
            },
          },
          { status: 202 },
        )
      },
    },
  },
})
