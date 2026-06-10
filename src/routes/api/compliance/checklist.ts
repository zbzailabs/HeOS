import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import {
  getComplianceChecklist,
  renderComplianceReport,
} from "../../../domain/compliance/checklist"
import { createTraceId } from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/compliance/checklist")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const traceId = createTraceId("compliance")
        const checklist = getComplianceChecklist()

        if (url.searchParams.get("format") === "markdown") {
          return new Response(renderComplianceReport(checklist), {
            status: 200,
            headers: {
              "content-type": "text/markdown; charset=utf-8",
              "x-trace-id": traceId,
            },
          })
        }

        return json({ traceId, data: checklist })
      },
    },
  },
})
