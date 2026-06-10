import { describe, expect, it } from "vitest"

import { createD1TraceDetailRepository } from "./detail"

describe("public trace detail", () => {
  it("returns public trace archives with project, cycle and agri records", async () => {
    const repository = createD1TraceDetailRepository(createFakeTraceD1())
    const detail = await repository.getPublicTraceDetail({
      tenantId: "tenant-tenglong-school",
      slug: "tlxx-lettuce-public",
    })

    expect(detail).toMatchObject({
      publicSlug: "tlxx-lettuce-public",
      visibility: "public",
      projectName: "腾龙小学智慧农场",
      cropCycleName: "2026 夏季教学叶菜",
      inspectionSummary: ["叶色正常", "墒情适宜"],
      agriRecords: [
        {
          taskTitle: "苗期日常巡检",
          acceptanceResult: "accepted",
        },
      ],
    })
  })

  it("does not return private archives through the public detail query", async () => {
    const repository = createD1TraceDetailRepository(createFakeTraceD1())
    const detail = await repository.getPublicTraceDetail({
      tenantId: "tenant-tenglong-school",
      slug: "tlxx-private",
    })

    expect(detail).toBeNull()
  })
})

function createFakeTraceD1() {
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async all() {
              if (sql.includes("FROM heos_trace_archives")) {
                const slug = values[1]

                if (slug === "tlxx-private") {
                  return { results: [] }
                }

                return {
                  results: [
                    {
                      id: "trace-public",
                      tenant_id: "tenant-tenglong-school",
                      crop_cycle_id: "crop-cycle-tenglong-lettuce-2026-summer",
                      public_slug: "tlxx-lettuce-public",
                      visibility: "public",
                      public_payload_json:
                        '{"inspectionSummary":["叶色正常","墒情适宜"]}',
                      created_at: "2026-06-11T09:00:00.000Z",
                      crop_cycle_name: "2026 夏季教学叶菜",
                      project_name: "腾龙小学智慧农场",
                    },
                  ],
                }
              }

              if (sql.includes("FROM heos_agri_task_records")) {
                return {
                  results: [
                    {
                      id: "record-1",
                      agri_task_id: "agri-task-tenglong-daily-inspection",
                      task_title: "苗期日常巡检",
                      executed_at: "2026-06-11T09:00:00.000Z",
                      acceptance_result: "accepted",
                      notes: "完成苗期巡检，验收通过。",
                      photo_asset_refs_json:
                        '["r2://heos/agri/daily-inspection.jpg"]',
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
