import { describe, expect, it } from "vitest"

import {
  createCoreApiHandlers,
  defaultCoreProjectId,
  defaultCoreQuerySeed,
  parseCoreProjectDetailQuery,
} from "./api"
import { coreApiErrorCodes } from "./query"

describe("core API handlers", () => {
  it("returns traceId-bearing 400 when tenantId is missing", () => {
    const handlers = createCoreApiHandlers(defaultCoreQuerySeed)
    const result = handlers.devices(new URLSearchParams(), "trace-test")

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      traceId: "trace-test",
      errors: [
        {
          code: coreApiErrorCodes.MISSING_TENANT,
          traceId: "trace-test",
        },
      ],
    })
  })

  it("returns paginated tenant-scoped devices", () => {
    const handlers = createCoreApiHandlers(defaultCoreQuerySeed)
    const result = handlers.devices(
      new URLSearchParams({
        tenantId: "tenant-tenglong-school",
        limit: "1",
      }),
      "trace-test",
    )

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      traceId: "trace-test",
      value: {
        total: 2,
        nextCursor: "device-renke-40406816",
      },
    })
  })

  it("parses project detail params with projectId requirement", () => {
    const result = parseCoreProjectDetailQuery(
      new URLSearchParams({ tenantId: "tenant-tenglong-school" }),
      "trace-test",
    )

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      traceId: "trace-test",
      errors: [
        {
          code: coreApiErrorCodes.MISSING_PROJECT,
        },
      ],
    })
  })

  it("aggregates dashboard and project detail through API handlers", () => {
    const handlers = createCoreApiHandlers(defaultCoreQuerySeed)
    const dashboard = handlers.dashboard(
      new URLSearchParams({ tenantId: "tenant-tenglong-school" }),
      "trace-test",
    )
    const project = handlers.projectDetail(
      new URLSearchParams({
        tenantId: "tenant-tenglong-school",
        projectId: defaultCoreProjectId,
      }),
      "trace-test",
    )

    expect(dashboard.ok && dashboard.value.projectCount).toBe(1)
    expect(project.ok && project.value.counts.devices).toBe(2)
  })
})
