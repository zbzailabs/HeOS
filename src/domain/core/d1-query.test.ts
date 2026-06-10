import { describe, expect, it } from "vitest"

import {
  createD1CoreQueryRepository,
  type CoreD1Database,
} from "./d1-query"

function createFakeD1(): CoreD1Database {
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async all() {
              const tenantId = values[0]

              if (!sql.includes("tenant_id = ?")) {
                throw new Error(`query must filter by tenant: ${sql}`)
              }

              if (sql.includes("FROM heos_devices")) {
                return {
                  results: [
                    {
                      id: "device-renke-40406816",
                      tenant_id: tenantId,
                      site_id: "site-tenglong-smart-farm",
                      external_device_id: "40406816",
                      name: "仁科四情测报设备 40406816",
                      online_status: "unknown",
                      last_seen_at: null,
                    },
                  ],
                }
              }

              if (sql.includes("FROM heos_trace_archives")) {
                return {
                  results: [
                    {
                      id: "trace-public",
                      tenant_id: tenantId,
                      crop_cycle_id: "cycle-1",
                      public_slug: "public-slug",
                      visibility: "public",
                      created_at: "2026-06-10T00:00:00.000Z",
                    },
                    {
                      id: "trace-private",
                      tenant_id: tenantId,
                      crop_cycle_id: "cycle-1",
                      public_slug: "private-slug",
                      visibility: "private",
                      created_at: "2026-06-10T00:00:00.000Z",
                    },
                  ],
                }
              }

              return { results: [] }
            },
          }
        },
      }
    },
  }
}

describe("D1 core query repository", () => {
  it("queries devices through tenant-scoped SQL and maps D1 rows", async () => {
    const repository = createD1CoreQueryRepository(createFakeD1())
    const devices = await repository.listDevices({
      tenantId: "tenant-tenglong-school",
      limit: 20,
    })

    expect(devices).toMatchObject({
      total: 1,
      nextCursor: "device-renke-40406816",
      items: [
        {
          id: "device-renke-40406816",
          tenantId: "tenant-tenglong-school",
          externalDeviceId: "40406816",
          onlineStatus: "unknown",
        },
      ],
    })
  })

  it("only returns public trace archives from D1", async () => {
    const repository = createD1CoreQueryRepository(createFakeD1())
    const traces = await repository.listTraceArchives({
      tenantId: "tenant-tenglong-school",
      limit: 20,
    })

    expect(traces.items.map((trace) => trace.visibility)).toEqual(["public"])
  })
})
