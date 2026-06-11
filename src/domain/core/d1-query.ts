import type {
  CoreAgriTask,
  CoreAiInteraction,
  CoreAiReviewQueueItem,
  CoreAlert,
  CoreDevice,
  CoreListQuery,
  CorePlot,
  CoreProject,
  CoreSite,
  CoreTraceArchive,
} from "./query"

export type CoreD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{
        results?: T[]
      }>
    }
  }
}

export type CorePage<T> = {
  items: T[]
  nextCursor: string | null
  total: number
}

const defaultLimit = 20
const maxLimit = 100

export function createD1CoreQueryRepository(db: CoreD1Database) {
  return {
    async getDashboard(query: Pick<CoreListQuery, "tenantId">) {
      const [projects, devices, alerts, agriTasks, traceArchives, aiInteractions] =
        await Promise.all([
          countRows(db, "heos_projects", query.tenantId),
          listAllDevices(db, query.tenantId),
          listAllAlerts(db, query.tenantId),
          listAllAgriTasks(db, query.tenantId),
          listAllTraceArchives(db, query.tenantId),
          listAllAiInteractions(db, query.tenantId),
        ])

      return {
        projectCount: projects,
        deviceCount: devices.length,
        onlineDeviceCount: devices.filter(
          (device) => device.onlineStatus === "online",
        ).length,
        openAlertCount: alerts.filter((alert) => alert.status === "open").length,
        pendingAgriTaskCount: agriTasks.filter((task) => task.status !== "done")
          .length,
        traceArchiveCount: traceArchives.length,
        aiInteractionCount: aiInteractions.length,
      }
    },

    async getProjectDetail(
      query: Pick<CoreListQuery, "tenantId"> & { projectId: string },
    ) {
      const [project] = await queryRows<ProjectRow>(
        db,
        `SELECT id, tenant_id, code, name, status
         FROM heos_projects
         WHERE tenant_id = ? AND id = ?
         LIMIT 1`,
        [query.tenantId, query.projectId],
      )
      const sites = await queryRows<SiteRow>(
        db,
        `SELECT id, tenant_id, project_id, name
         FROM heos_sites
         WHERE tenant_id = ? AND project_id = ?
         ORDER BY id`,
        [query.tenantId, query.projectId],
      )
      const siteIds = sites.map((site) => site.id)
      const plots = await listAllPlots(db, query.tenantId)
      const greenhouses = await listAllGreenhouses(db, query.tenantId)
      const devices = await listAllDevices(db, query.tenantId)
      const alerts = await listAllAlerts(db, query.tenantId)

      return {
        project: project ? mapProject(project) : null,
        sites: sites.map(mapSite),
        plots: plots.filter((plot) => siteIds.includes(plot.siteId)),
        greenhouses,
        devices: devices.filter((device) => siteIds.includes(device.siteId)),
        alerts: alerts.filter((alert) => siteIds.includes(alert.siteId)),
        counts: {
          sites: sites.length,
          plots: plots.length,
          greenhouses: greenhouses.length,
          devices: devices.filter((device) => siteIds.includes(device.siteId))
            .length,
          openAlerts: alerts.filter(
            (alert) => siteIds.includes(alert.siteId) && alert.status === "open",
          ).length,
        },
      }
    },

    async listDevices(query: CoreListQuery) {
      return pageRows(
        await listAllDevices(db, query.tenantId),
        query,
        (device) =>
          (!query.siteId || device.siteId === query.siteId) &&
          (!query.status || device.onlineStatus === query.status),
      )
    },

    async listAlerts(query: CoreListQuery) {
      return pageRows(
        await listAllAlerts(db, query.tenantId),
        query,
        (alert) =>
          (!query.siteId || alert.siteId === query.siteId) &&
          (!query.status || alert.status === query.status),
      )
    },

    async listAgriTasks(query: CoreListQuery) {
      return pageRows(
        await listAllAgriTasks(db, query.tenantId),
        query,
        (task) => !query.status || task.status === query.status,
      )
    },

    async listTraceArchives(query: CoreListQuery) {
      return pageRows(
        (await listAllTraceArchives(db, query.tenantId)).filter(
          (trace) => trace.visibility === "public",
        ),
        query,
      )
    },

    async listAiInteractions(query: CoreListQuery) {
      return pageRows(await listAllAiInteractions(db, query.tenantId), query)
    },

    async listAiReviewQueue(query: CoreListQuery) {
      return pageRows(await listAllAiReviewQueue(db, query.tenantId), query)
    },
  }
}

async function listAllDevices(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<DeviceRow>(
    db,
    `SELECT id, tenant_id, site_id, external_device_id, name, online_status, last_seen_at
     FROM heos_devices
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapDevice)
}

async function listAllAlerts(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<AlertRow>(
    db,
    `SELECT id, tenant_id, site_id, device_id, level, alert_type, status, created_at, reason
     FROM heos_alerts
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapAlert)
}

async function listAllAgriTasks(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<AgriTaskRow>(
    db,
    `SELECT id, tenant_id, crop_cycle_id, title, status, planned_start_at
     FROM heos_agri_tasks
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapAgriTask)
}

async function listAllTraceArchives(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<TraceArchiveRow>(
    db,
    `SELECT id, tenant_id, crop_cycle_id, public_slug, visibility, created_at
     FROM heos_trace_archives
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapTraceArchive)
}

async function listAllAiInteractions(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<AiInteractionRow>(
    db,
    `SELECT id, tenant_id, scenario, model_name, created_at, cost_cents,
            output_summary, retrieval_sources_json, human_confirmation_required
     FROM heos_ai_interactions
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapAiInteraction)
}

async function listAllAiReviewQueue(
  db: CoreD1Database,
  tenantId: string,
): Promise<CoreAiReviewQueueItem[]> {
  const rows = await queryRows<AiReviewQueueRow>(
    db,
    `SELECT ai.id,
            ai.tenant_id,
            ai.scenario,
            ai.model_name,
            ai.output_summary,
            ai.retrieval_sources_json,
            ai.created_at
     FROM heos_ai_interactions ai
     LEFT JOIN heos_ai_review_actions review
       ON review.tenant_id = ai.tenant_id
      AND review.interaction_id = ai.id
     WHERE ai.tenant_id = ?
       AND ai.human_confirmation_required = 1
       AND review.id IS NULL
     ORDER BY ai.created_at DESC, ai.id`,
    [tenantId],
  )
  return rows.map(mapAiReviewQueueItem)
}

async function listAllPlots(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<PlotRow>(
    db,
    `SELECT id, tenant_id, site_id, name
     FROM heos_plots
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapPlot)
}

async function listAllGreenhouses(db: CoreD1Database, tenantId: string) {
  const rows = await queryRows<GreenhouseRow>(
    db,
    `SELECT id, tenant_id, plot_id, name
     FROM heos_greenhouses
     WHERE tenant_id = ?
     ORDER BY id`,
    [tenantId],
  )
  return rows.map(mapGreenhouse)
}

async function countRows(
  db: CoreD1Database,
  tableName: string,
  tenantId: string,
) {
  const rows = await queryRows<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count FROM ${tableName} WHERE tenant_id = ?`,
    [tenantId],
  )
  return rows[0]?.count ?? 0
}

async function queryRows<T>(
  db: CoreD1Database,
  sql: string,
  values: unknown[],
) {
  const result = await db.prepare(sql).bind(...values).all<T>()
  return result.results ?? []
}

function pageRows<T extends { id: string }>(
  rows: readonly T[],
  query: CoreListQuery,
  filter: (row: T) => boolean = () => true,
): CorePage<T> {
  const sorted = rows.filter(filter).sort((left, right) => left.id.localeCompare(right.id))
  const startIndex = query.cursor
    ? Math.max(
        0,
        sorted.findIndex((item) => item.id === query.cursor) + 1,
      )
    : 0
  const limit = normalizeLimit(query.limit)
  const items = sorted.slice(startIndex, startIndex + limit)
  const last = items.at(-1)

  return {
    items,
    nextCursor: last ? last.id : null,
    total: sorted.length,
  }
}

function normalizeLimit(value: number | undefined) {
  if (!value || !Number.isInteger(value) || value < 1) {
    return defaultLimit
  }

  return Math.min(value, maxLimit)
}

type ProjectRow = {
  id: string
  tenant_id: string
  code: string
  name: string
  status: string
}

type SiteRow = {
  id: string
  tenant_id: string
  project_id: string
  name: string
}

type PlotRow = {
  id: string
  tenant_id: string
  site_id: string
  name: string
}

type GreenhouseRow = {
  id: string
  tenant_id: string
  plot_id: string
  name: string
}

type DeviceRow = {
  id: string
  tenant_id: string
  site_id: string
  external_device_id: string
  name: string
  online_status: "online" | "offline" | "unknown"
  last_seen_at: string | null
}

type AlertRow = {
  id: string
  tenant_id: string
  site_id: string
  device_id: string | null
  level: string
  alert_type: string
  status: string
  created_at: string
  reason: string
}

type AgriTaskRow = {
  id: string
  tenant_id: string
  crop_cycle_id: string
  title: string
  status: string
  planned_start_at: string | null
}

type TraceArchiveRow = {
  id: string
  tenant_id: string
  crop_cycle_id: string
  public_slug: string
  visibility: string
  created_at: string
}

type AiInteractionRow = {
  id: string
  tenant_id: string
  scenario: string
  model_name: string
  created_at: string
  cost_cents: number
  output_summary?: string
  retrieval_sources_json?: string
  human_confirmation_required?: number
}

type AiReviewQueueRow = {
  id: string
  tenant_id: string
  scenario: string
  model_name: string
  output_summary: string
  retrieval_sources_json: string
  created_at: string
}

function mapProject(row: ProjectRow): CoreProject {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    name: row.name,
    status: row.status,
  }
}

function mapSite(row: SiteRow): CoreSite {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    projectId: row.project_id,
    name: row.name,
  }
}

function mapPlot(row: PlotRow): CorePlot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    siteId: row.site_id,
    name: row.name,
  }
}

function mapGreenhouse(row: GreenhouseRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    plotId: row.plot_id,
    name: row.name,
  }
}

function mapDevice(row: DeviceRow): CoreDevice {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    siteId: row.site_id,
    externalDeviceId: row.external_device_id,
    name: row.name,
    onlineStatus: row.online_status,
    lastSeenAt: row.last_seen_at,
  }
}

function mapAlert(row: AlertRow): CoreAlert {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    siteId: row.site_id,
    deviceId: row.device_id,
    level: row.level,
    type: row.alert_type,
    status: row.status,
    createdAt: row.created_at,
    reason: row.reason,
  }
}

function mapAgriTask(row: AgriTaskRow): CoreAgriTask {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cropCycleId: row.crop_cycle_id,
    title: row.title,
    status: row.status,
    plannedStartAt: row.planned_start_at,
  }
}

function mapTraceArchive(row: TraceArchiveRow): CoreTraceArchive {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cropCycleId: row.crop_cycle_id,
    publicSlug: row.public_slug,
    visibility: row.visibility,
    createdAt: row.created_at,
  }
}

function mapAiInteraction(row: AiInteractionRow): CoreAiInteraction {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    scenario: row.scenario,
    modelName: row.model_name,
    createdAt: row.created_at,
    costCents: row.cost_cents,
    humanConfirmationRequired: row.human_confirmation_required === 1,
    outputSummary: row.output_summary ?? "",
    sourceTitle: readFirstSourceTitle(row.retrieval_sources_json),
  }
}

function mapAiReviewQueueItem(row: AiReviewQueueRow): CoreAiReviewQueueItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    scenario: row.scenario,
    modelName: row.model_name,
    sourceTitle: readFirstSourceTitle(row.retrieval_sources_json),
    outputSummary: row.output_summary,
    createdAt: row.created_at,
  }
}

function readFirstSourceTitle(value: string | undefined) {
  if (!value) {
    return "授权来源"
  }

  try {
    const sources = JSON.parse(value) as { title?: unknown }[]
    const title = sources[0]?.title
    return typeof title === "string" && title.length > 0 ? title : "授权来源"
  } catch {
    return "授权来源"
  }
}
