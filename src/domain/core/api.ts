import { alertTypes } from "../standards/enums"
import { createTraceId } from "../telemetry/api"
import {
  coreApiErrorCodes,
  createCoreQueryRepository,
  getCoreDashboard,
  getCoreProjectDetail,
  listCoreAgriTasks,
  listCoreAiReviewQueue,
  listCoreAiInteractions,
  listCoreAlerts,
  listCoreDevices,
  listCoreTraceArchives,
  parseCoreListQuery,
  type CoreApiError,
  type CoreApiResult,
  type CoreListQuery,
  type CoreQuerySeed,
} from "./query"
import {
  createD1CoreQueryRepository,
  type CoreD1Database,
} from "./d1-query"

export const defaultCoreTenantId = "tenant-tenglong-school"
export const defaultCoreProjectId = "project-tenglong-smart-farm"

export const defaultCoreQuerySeed: CoreQuerySeed = {
  projects: [
    {
      id: defaultCoreProjectId,
      tenantId: defaultCoreTenantId,
      code: "tlxx-smart-farm",
      name: "腾龙小学智慧农场",
      status: "active",
    },
  ],
  sites: [
    {
      id: "site-tenglong-smart-farm",
      tenantId: defaultCoreTenantId,
      projectId: defaultCoreProjectId,
      name: "腾龙小学智慧农场",
    },
  ],
  plots: [
    {
      id: "plot-teaching-1",
      tenantId: defaultCoreTenantId,
      siteId: "site-tenglong-smart-farm",
      name: "教学一号地块",
    },
  ],
  greenhouses: [
    {
      id: "greenhouse-teaching-1",
      tenantId: defaultCoreTenantId,
      plotId: "plot-teaching-1",
      name: "教学一号大棚",
    },
  ],
  devices: [
    {
      id: "device-renke-40406816",
      tenantId: defaultCoreTenantId,
      siteId: "site-tenglong-smart-farm",
      externalDeviceId: "40406816",
      name: "Renke 40406816",
      onlineStatus: "online",
      lastSeenAt: "2026-06-10T08:00:00.000Z",
    },
    {
      id: "device-renke-offline-demo",
      tenantId: defaultCoreTenantId,
      siteId: "site-tenglong-smart-farm",
      externalDeviceId: "rk-offline-demo",
      name: "离线规则演示设备",
      onlineStatus: "offline",
      lastSeenAt: "2026-06-10T07:40:00.000Z",
    },
  ],
  alerts: [
    {
      id: "alert-offline-demo",
      tenantId: defaultCoreTenantId,
      siteId: "site-tenglong-smart-farm",
      deviceId: "device-renke-offline-demo",
      level: "warning",
      type: alertTypes.OFFLINE,
      status: "open",
      createdAt: "2026-06-10T08:00:00.000Z",
      reason: "最近一次数据时间超过 300 秒。",
    },
  ],
  agriTasks: [
    {
      id: "agri-task-inspection",
      tenantId: defaultCoreTenantId,
      cropCycleId: "cycle-teaching-tomato",
      title: "番茄苗期巡检",
      status: "planned",
      plannedStartAt: "2026-06-11T00:00:00.000Z",
    },
  ],
  traceArchives: [
    {
      id: "trace-teaching-tomato",
      tenantId: defaultCoreTenantId,
      cropCycleId: "cycle-teaching-tomato",
      publicSlug: "tlxx-tomato-001",
      visibility: "public",
      createdAt: "2026-06-10T08:00:00.000Z",
    },
  ],
  aiInteractions: [
    {
      id: "ai-alert-explanation",
      tenantId: defaultCoreTenantId,
      scenario: "alert_explanation",
      modelName: "gpt-4.1-mini",
      createdAt: "2026-06-10T08:00:00.000Z",
      costCents: 3,
      humanConfirmationRequired: true,
      outputSummary: "建议先检查供应商在线状态和现场供电。",
      sourceTitle: "离线规则演示设备",
    },
  ],
  aiReviewActions: [],
}

export function createCoreApiHandlers(seed: CoreQuerySeed = defaultCoreQuerySeed) {
  const repository = createCoreQueryRepository(seed)

  return {
    dashboard: (params: URLSearchParams, traceId = createTraceId("core")) => {
      const parsed = parseCoreListQuery(params, traceId)
      if (!parsed.ok) {
        return parsed
      }

      return ok(getCoreDashboard(repository, parsed.value), traceId)
    },
    projectDetail: (params: URLSearchParams, traceId = createTraceId("core")) => {
      const parsed = parseCoreProjectDetailQuery(params, traceId)
      if (!parsed.ok) {
        return parsed
      }

      return ok(getCoreProjectDetail(repository, parsed.value), traceId)
    },
    devices: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) => listCoreDevices(repository, query)),
    alerts: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) => listCoreAlerts(repository, query)),
    agriTasks: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) => listCoreAgriTasks(repository, query)),
    traceArchives: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) =>
        listCoreTraceArchives(repository, query),
      ),
    aiInteractions: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) =>
        listCoreAiInteractions(repository, query),
      ),
    aiReviewQueue: (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandler(params, traceId, (query) =>
        listCoreAiReviewQueue(repository, query),
      ),
  }
}

export function createD1CoreApiHandlers(db: CoreD1Database) {
  const repository = createD1CoreQueryRepository(db)

  return {
    dashboard: async (
      params: URLSearchParams,
      traceId = createTraceId("core"),
    ) => {
      const parsed = parseCoreListQuery(params, traceId)
      if (!parsed.ok) {
        return parsed
      }

      return ok(await repository.getDashboard(parsed.value), traceId)
    },
    projectDetail: async (
      params: URLSearchParams,
      traceId = createTraceId("core"),
    ) => {
      const parsed = parseCoreProjectDetailQuery(params, traceId)
      if (!parsed.ok) {
        return parsed
      }

      return ok(await repository.getProjectDetail(parsed.value), traceId)
    },
    devices: async (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandlerAsync(params, traceId, (query) => repository.listDevices(query)),
    alerts: async (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandlerAsync(params, traceId, (query) => repository.listAlerts(query)),
    agriTasks: async (params: URLSearchParams, traceId = createTraceId("core")) =>
      listHandlerAsync(params, traceId, (query) => repository.listAgriTasks(query)),
    traceArchives: async (
      params: URLSearchParams,
      traceId = createTraceId("core"),
    ) =>
      listHandlerAsync(params, traceId, (query) =>
        repository.listTraceArchives(query),
      ),
    aiInteractions: async (
      params: URLSearchParams,
      traceId = createTraceId("core"),
    ) =>
      listHandlerAsync(params, traceId, (query) =>
        repository.listAiInteractions(query),
      ),
    aiReviewQueue: async (
      params: URLSearchParams,
      traceId = createTraceId("core"),
    ) =>
      listHandlerAsync(params, traceId, (query) =>
        repository.listAiReviewQueue(query),
      ),
  }
}

export function parseCoreProjectDetailQuery(
  params: URLSearchParams,
  traceId = createTraceId("core"),
): CoreApiResult<Pick<CoreListQuery, "tenantId"> & { projectId: string }> {
  const parsed = parseCoreListQuery(params, traceId)
  if (!parsed.ok) {
    return parsed
  }

  const projectId = params.get("projectId")
  if (!projectId) {
    return {
      ok: false,
      status: 400,
      traceId,
      errors: [projectIdRequiredError(traceId)],
    }
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: {
      tenantId: parsed.value.tenantId,
      projectId,
    },
  }
}

export function projectIdRequiredError(traceId: string): CoreApiError {
  return {
    status: 400,
    code: coreApiErrorCodes.MISSING_PROJECT,
    message: "projectId is required.",
    details: { param: "projectId" },
    traceId,
  }
}

function listHandler<T>(
  params: URLSearchParams,
  traceId: string,
  handler: (query: CoreListQuery) => T,
) {
  const parsed = parseCoreListQuery(params, traceId)
  if (!parsed.ok) {
    return parsed
  }

  return ok(handler(parsed.value), traceId)
}

async function listHandlerAsync<T>(
  params: URLSearchParams,
  traceId: string,
  handler: (query: CoreListQuery) => Promise<T>,
) {
  const parsed = parseCoreListQuery(params, traceId)
  if (!parsed.ok) {
    return parsed
  }

  return ok(await handler(parsed.value), traceId)
}

function ok<T>(value: T, traceId: string): CoreApiResult<T> {
  return {
    ok: true,
    status: 200,
    traceId,
    value,
  }
}
