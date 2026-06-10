import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const seedSql = readFileSync(
  new URL("../../../db/seeds/0001_tenglong_smart_farm.sql", import.meta.url),
  "utf8",
)

describe("Tenglong smart farm D1 seed", () => {
  it("uses stable ids and idempotent upserts for core production records", () => {
    for (const tableName of [
      "heos_tenants",
      "heos_projects",
      "heos_sites",
      "heos_plots",
      "heos_greenhouses",
      "heos_provider_accounts",
      "heos_devices",
      "heos_crop_models",
      "heos_crop_model_stages",
      "heos_crop_cycles",
      "heos_agri_tasks",
      "heos_trace_archives",
      "heos_ai_interactions",
      "heos_sync_runs",
    ]) {
      expect(seedSql, `${tableName} must be seeded`).toContain(
        `INSERT INTO ${tableName}`,
      )
    }

    expect(seedSql).toContain("tenant-tenglong-school")
    expect(seedSql).toContain("project-tenglong-smart-farm")
    expect(seedSql).toContain("40406816")
    expect(seedSql).toContain("ON CONFLICT")
  })

  it("does not store Renke plaintext credentials or tokens", () => {
    expect(seedSql).toContain("credential_secret_ref")
    expect(seedSql).toContain("RENKE_LOGIN_PASSWORD")
    expect(seedSql).not.toContain("cq260519tlxx")
    expect(seedSql).not.toContain("token_plaintext")
  })
})
