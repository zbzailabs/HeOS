import { describe, expect, it } from "vitest"

import {
  createCoreQueryRepository,
  coreApiErrorCodes,
  getCoreDashboard,
  getCoreProjectDetail,
  listCoreAgriTasks,
  listCoreAiInteractions,
  listCoreAlerts,
  listCoreDevices,
  listCoreTraceArchives,
  parseCoreListQuery,
  tenantIdRequiredError,
  type CoreQuerySeed,
} from "./query"

const seed: CoreQuerySeed = {
  projects: [
    {
      id: "project-1",
      tenantId: "tenant-a",
      code: "p-a",
      name: "腾龙小学智慧农场",
      status: "active",
    },
    {
      id: "project-2",
      tenantId: "tenant-b",
      code: "p-b",
      name: "其他租户项目",
      status: "active",
    },
  ],
  sites: [
    {
      id: "site-1",
      tenantId: "tenant-a",
      projectId: "project-1",
      name: "教学农场",
    },
  ],
  plots: [
    {
      id: "plot-1",
      tenantId: "tenant-a",
      siteId: "site-1",
      name: "一号地块",
    },
  ],
  greenhouses: [
    {
      id: "greenhouse-1",
      tenantId: "tenant-a",
      plotId: "plot-1",
      name: "一号大棚",
    },
  ],
  devices: [
    {
      id: "device-1",
      tenantId: "tenant-a",
      siteId: "site-1",
      externalDeviceId: "40406816",
      name: "Renke 40406816",
      onlineStatus: "online",
      lastSeenAt: "2026-06-10T08:00:00.000Z",
    },
    {
      id: "device-2",
      tenantId: "tenant-a",
      siteId: "site-1",
      externalDeviceId: "40406817",
      name: "Renke 40406817",
      onlineStatus: "offline",
      lastSeenAt: "2026-06-10T07:40:00.000Z",
    },
    {
      id: "device-3",
      tenantId: "tenant-b",
      siteId: "site-2",
      externalDeviceId: "other",
      name: "其他租户设备",
      onlineStatus: "online",
      lastSeenAt: "2026-06-10T08:00:00.000Z",
    },
  ],
  alerts: [
    {
      id: "alert-1",
      tenantId: "tenant-a",
      siteId: "site-1",
      deviceId: "device-2",
      level: "warning",
      type: "offline",
      status: "open",
      createdAt: "2026-06-10T08:00:00.000Z",
      reason: "5 分钟未上报",
    },
    {
      id: "alert-2",
      tenantId: "tenant-b",
      siteId: "site-2",
      deviceId: "device-3",
      level: "critical",
      type: "threshold",
      status: "open",
      createdAt: "2026-06-10T08:00:00.000Z",
      reason: "其他租户告警",
    },
  ],
  agriTasks: [
    {
      id: "task-1",
      tenantId: "tenant-a",
      cropCycleId: "cycle-1",
      title: "巡检",
      status: "planned",
      plannedStartAt: "2026-06-11T00:00:00.000Z",
    },
  ],
  traceArchives: [
    {
      id: "trace-1",
      tenantId: "tenant-a",
      cropCycleId: "cycle-1",
      publicSlug: "tlxx-001",
      visibility: "public",
      createdAt: "2026-06-10T08:00:00.000Z",
    },
  ],
  aiInteractions: [
    {
      id: "ai-1",
      tenantId: "tenant-a",
      scenario: "alert_explanation",
      modelName: "gpt-4.1-mini",
      createdAt: "2026-06-10T08:00:00.000Z",
      costCents: 3,
    },
  ],
}

describe("core query repository", () => {
  it("requires tenantId for every list query", () => {
    const result = parseCoreListQuery(new URLSearchParams(), "trace-test")

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      traceId: "trace-test",
      errors: [tenantIdRequiredError("trace-test")],
    })
  })

  it("filters list results by tenant and paginates deterministically", () => {
    const repository = createCoreQueryRepository(seed)
    const result = listCoreDevices(repository, {
      tenantId: "tenant-a",
      limit: 1,
      cursor: "device-1",
    })

    expect(result.items.map((device) => device.id)).toEqual(["device-2"])
    expect(result.nextCursor).toBe("device-2")
    expect(result.total).toBe(2)
  })

  it("aggregates project detail by project, site, plot, greenhouse, device, and alert", () => {
    const repository = createCoreQueryRepository(seed)
    const detail = getCoreProjectDetail(repository, {
      tenantId: "tenant-a",
      projectId: "project-1",
    })

    expect(detail).toMatchObject({
      project: { name: "腾龙小学智慧农场" },
      counts: {
        sites: 1,
        plots: 1,
        greenhouses: 1,
        devices: 2,
        openAlerts: 1,
      },
    })
    expect(detail.devices.map((device) => device.tenantId)).toEqual([
      "tenant-a",
      "tenant-a",
    ])
  })

  it("summarizes dashboard counts for the current tenant only", () => {
    const repository = createCoreQueryRepository(seed)
    const dashboard = getCoreDashboard(repository, { tenantId: "tenant-a" })

    expect(dashboard).toMatchObject({
      projectCount: 1,
      deviceCount: 2,
      onlineDeviceCount: 1,
      openAlertCount: 1,
      pendingAgriTaskCount: 1,
      traceArchiveCount: 1,
      aiInteractionCount: 1,
    })
  })

  it("returns traceId-bearing validation errors for missing tenantId", () => {
    const error = tenantIdRequiredError("trace-test")

    expect(error).toMatchObject({
      status: 400,
      code: coreApiErrorCodes.MISSING_TENANT,
      traceId: "trace-test",
    })
  })

  it("exposes PRD list boundaries for alerts, agri tasks, trace archives, and AI logs", () => {
    const repository = createCoreQueryRepository(seed)
    const query = { tenantId: "tenant-a", limit: 20 }

    expect(listCoreAlerts(repository, query).items).toHaveLength(1)
    expect(listCoreAgriTasks(repository, query).items).toHaveLength(1)
    expect(listCoreTraceArchives(repository, query).items).toHaveLength(1)
    expect(listCoreAiInteractions(repository, query).items).toHaveLength(1)
  })
})
