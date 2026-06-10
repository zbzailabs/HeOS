import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { defaultCoreTenantId } from "../domain/core/api"
import {
  createD1TraceDetailRepository,
  type PublicTraceDetail,
  type TraceDetailD1Database,
} from "../domain/trace/detail"

type TraceDetailInput = {
  slug: string
}

export const getPublicTraceDetail = createServerFn({
  method: "GET",
})
  .validator((input: TraceDetailInput) => input)
  .handler(async ({ data }) => {
    const db = (env as { HEOS_DB?: TraceDetailD1Database }).HEOS_DB

    if (!db) {
      return getFallbackTraceDetail(data.slug)
    }

    try {
      return await createD1TraceDetailRepository(db).getPublicTraceDetail({
        tenantId: defaultCoreTenantId,
        slug: data.slug,
      })
    } catch {
      return getFallbackTraceDetail(data.slug)
    }
  })

function getFallbackTraceDetail(slug: string): PublicTraceDetail | null {
  if (slug !== "tlxx-lettuce-2026-summer") {
    return null
  }

  return {
    id: "trace-tenglong-lettuce-2026-summer",
    tenantId: defaultCoreTenantId,
    cropCycleId: "crop-cycle-tenglong-lettuce-2026-summer",
    publicSlug: slug,
    visibility: "public",
    createdAt: "2026-06-10T00:00:00.000Z",
    projectName: "腾龙小学智慧农场",
    cropCycleName: "2026 夏季教学叶菜",
    inspectionSummary: ["公开字段已启用", "农事记录完成后自动更新"],
    publicPayload: {},
    agriRecords: [],
  }
}
