import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import {
  createCoreApiHandlers,
  createD1CoreApiHandlers,
} from "../domain/core/api"
import type { CoreD1Database } from "../domain/core/d1-query"

type CoreHandlerName =
  | "dashboard"
  | "projectDetail"
  | "devices"
  | "alerts"
  | "agriTasks"
  | "traceArchives"
  | "aiInteractions"

const fallbackHandlers = createCoreApiHandlers()

export async function handleCoreApiRequest(
  handlerName: CoreHandlerName,
  request: Request,
) {
  const url = new URL(request.url)
  const result = await getCoreHandlers()[handlerName](url.searchParams)

  return json(
    result.ok
      ? { traceId: result.traceId, data: result.value }
      : { traceId: result.traceId, errors: result.errors },
    { status: result.status },
  )
}

function getCoreHandlers() {
  const coreEnv = env as {
    HEOS_DB?: CoreD1Database
  }

  return coreEnv.HEOS_DB
    ? createD1CoreApiHandlers(coreEnv.HEOS_DB)
    : fallbackHandlers
}
