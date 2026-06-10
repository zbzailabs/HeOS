import { createTraceId } from "../telemetry/api"

export const coreApiErrorCodes = {
  MISSING_TENANT: "CORE_MISSING_TENANT",
  MISSING_PROJECT: "CORE_MISSING_PROJECT",
} as const

export type CoreApiErrorCode =
  (typeof coreApiErrorCodes)[keyof typeof coreApiErrorCodes]

export type CoreApiError = {
  status: 400
  code: CoreApiErrorCode
  message: string
  details: Record<string, string>
  traceId: string
}

export type CoreApiResult<T> =
  | {
      ok: true
      status: 200
      traceId: string
      value: T
    }
  | {
      ok: false
      status: 400
      traceId: string
      errors: CoreApiError[]
    }

export type CoreListQuery = {
  tenantId: string
  limit?: number
  cursor?: string
  status?: string
  siteId?: string
}

export type CoreProject = {
  id: string
  tenantId: string
  code: string
  name: string
  status: string
}

export type CoreSite = {
  id: string
  tenantId: string
  projectId: string
  name: string
}

export type CorePlot = {
  id: string
  tenantId: string
  siteId: string
  name: string
}

export type CoreGreenhouse = {
  id: string
  tenantId: string
  plotId: string
  name: string
}

export type CoreDevice = {
  id: string
  tenantId: string
  siteId: string
  externalDeviceId: string
  name: string
  onlineStatus: "online" | "offline" | "unknown"
  lastSeenAt: string | null
}

export type CoreAlert = {
  id: string
  tenantId: string
  siteId: string
  deviceId: string | null
  level: string
  type: string
  status: string
  createdAt: string
  reason: string
}

export type CoreAgriTask = {
  id: string
  tenantId: string
  cropCycleId: string
  title: string
  status: string
  plannedStartAt: string | null
}

export type CoreTraceArchive = {
  id: string
  tenantId: string
  cropCycleId: string
  publicSlug: string
  visibility: string
  createdAt: string
}

export type CoreAiInteraction = {
  id: string
  tenantId: string
  scenario: string
  modelName: string
  createdAt: string
  costCents: number
}

export type CoreQuerySeed = {
  projects: CoreProject[]
  sites: CoreSite[]
  plots: CorePlot[]
  greenhouses: CoreGreenhouse[]
  devices: CoreDevice[]
  alerts: CoreAlert[]
  agriTasks: CoreAgriTask[]
  traceArchives: CoreTraceArchive[]
  aiInteractions: CoreAiInteraction[]
}

export type CoreQueryRepository = ReturnType<typeof createCoreQueryRepository>

const defaultLimit = 20
const maxLimit = 100

export function createCoreQueryRepository(seed: CoreQuerySeed) {
  return {
    projects: [...seed.projects],
    sites: [...seed.sites],
    plots: [...seed.plots],
    greenhouses: [...seed.greenhouses],
    devices: [...seed.devices],
    alerts: [...seed.alerts],
    agriTasks: [...seed.agriTasks],
    traceArchives: [...seed.traceArchives],
    aiInteractions: [...seed.aiInteractions],
  }
}

export function parseCoreListQuery(
  params: URLSearchParams,
  traceId = createTraceId("core"),
): CoreApiResult<CoreListQuery> {
  const tenantId = params.get("tenantId")

  if (!tenantId) {
    return {
      ok: false,
      status: 400,
      traceId,
      errors: [tenantIdRequiredError(traceId)],
    }
  }

  return {
    ok: true,
    status: 200,
    traceId,
    value: {
      tenantId,
      limit: normalizeLimit(params.get("limit")),
      cursor: params.get("cursor") ?? undefined,
      status: params.get("status") ?? undefined,
      siteId: params.get("siteId") ?? undefined,
    },
  }
}

export function tenantIdRequiredError(traceId: string): CoreApiError {
  return {
    status: 400,
    code: coreApiErrorCodes.MISSING_TENANT,
    message: "tenantId is required.",
    details: { param: "tenantId" },
    traceId,
  }
}

export function getCoreDashboard(
  repository: CoreQueryRepository,
  query: Pick<CoreListQuery, "tenantId">,
) {
  const devices = tenantItems(repository.devices, query.tenantId)
  const alerts = tenantItems(repository.alerts, query.tenantId)
  const agriTasks = tenantItems(repository.agriTasks, query.tenantId)

  return {
    projectCount: tenantItems(repository.projects, query.tenantId).length,
    deviceCount: devices.length,
    onlineDeviceCount: devices.filter((device) => device.onlineStatus === "online")
      .length,
    openAlertCount: alerts.filter((alert) => alert.status === "open").length,
    pendingAgriTaskCount: agriTasks.filter((task) => task.status !== "done").length,
    traceArchiveCount: tenantItems(repository.traceArchives, query.tenantId).length,
    aiInteractionCount: tenantItems(repository.aiInteractions, query.tenantId)
      .length,
  }
}

export function getCoreProjectDetail(
  repository: CoreQueryRepository,
  query: Pick<CoreListQuery, "tenantId"> & { projectId: string },
) {
  const project = repository.projects.find(
    (item) => item.tenantId === query.tenantId && item.id === query.projectId,
  )
  const sites = tenantItems(repository.sites, query.tenantId).filter(
    (site) => site.projectId === query.projectId,
  )
  const siteIds = new Set(sites.map((site) => site.id))
  const plots = tenantItems(repository.plots, query.tenantId).filter((plot) =>
    siteIds.has(plot.siteId),
  )
  const plotIds = new Set(plots.map((plot) => plot.id))
  const greenhouses = tenantItems(repository.greenhouses, query.tenantId).filter(
    (greenhouse) => plotIds.has(greenhouse.plotId),
  )
  const devices = tenantItems(repository.devices, query.tenantId).filter((device) =>
    siteIds.has(device.siteId),
  )
  const alerts = tenantItems(repository.alerts, query.tenantId).filter((alert) =>
    siteIds.has(alert.siteId),
  )

  return {
    project: project ?? null,
    sites,
    plots,
    greenhouses,
    devices,
    alerts,
    counts: {
      sites: sites.length,
      plots: plots.length,
      greenhouses: greenhouses.length,
      devices: devices.length,
      openAlerts: alerts.filter((alert) => alert.status === "open").length,
    },
  }
}

export function listCoreDevices(
  repository: CoreQueryRepository,
  query: CoreListQuery,
) {
  return pageItems(
    tenantItems(repository.devices, query.tenantId)
      .filter((device) => !query.siteId || device.siteId === query.siteId)
      .filter((device) => !query.status || device.onlineStatus === query.status),
    query,
  )
}

export function listCoreAlerts(
  repository: CoreQueryRepository,
  query: CoreListQuery,
) {
  return pageItems(
    tenantItems(repository.alerts, query.tenantId)
      .filter((alert) => !query.siteId || alert.siteId === query.siteId)
      .filter((alert) => !query.status || alert.status === query.status),
    query,
  )
}

export function listCoreAgriTasks(
  repository: CoreQueryRepository,
  query: CoreListQuery,
) {
  return pageItems(
    tenantItems(repository.agriTasks, query.tenantId).filter(
      (task) => !query.status || task.status === query.status,
    ),
    query,
  )
}

export function listCoreTraceArchives(
  repository: CoreQueryRepository,
  query: CoreListQuery,
) {
  return pageItems(tenantItems(repository.traceArchives, query.tenantId), query)
}

export function listCoreAiInteractions(
  repository: CoreQueryRepository,
  query: CoreListQuery,
) {
  return pageItems(tenantItems(repository.aiInteractions, query.tenantId), query)
}

function tenantItems<T extends { tenantId: string }>(
  items: readonly T[],
  tenantId: string,
) {
  return items.filter((item) => item.tenantId === tenantId)
}

function pageItems<T extends { id: string }>(items: readonly T[], query: CoreListQuery) {
  const sorted = [...items].sort((left, right) => left.id.localeCompare(right.id))
  const startIndex = query.cursor
    ? Math.max(
        0,
        sorted.findIndex((item) => item.id === query.cursor) + 1,
      )
    : 0
  const limit = query.limit ?? defaultLimit
  const page = sorted.slice(startIndex, startIndex + limit)
  const last = page.at(-1)

  return {
    items: page,
    nextCursor: last ? last.id : null,
    total: sorted.length,
  }
}

function normalizeLimit(value: string | null) {
  if (!value) {
    return defaultLimit
  }

  const limit = Number(value)

  if (!Number.isInteger(limit) || limit < 1) {
    return defaultLimit
  }

  return Math.min(limit, maxLimit)
}
