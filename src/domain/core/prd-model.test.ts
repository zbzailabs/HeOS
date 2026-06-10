import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  findForbiddenCredentialColumns,
  findMissingPrdTables,
  getPrdCoverageSummary,
  prdCoreMigration,
  prdCoreTables,
  prdDomainCoverage,
  prdDomainIds,
} from "./prd-model"

const migrationSql = readFileSync(
  new URL(
    "../../../db/migrations/0004_heos_prd_core_domains.sql",
    import.meta.url,
  ),
  "utf8",
)

describe("PRD core domain model", () => {
  it("covers every first-release PRD domain with a tracked data foundation", () => {
    expect(prdDomainCoverage.map((domain) => domain.id)).toEqual([
      prdDomainIds.WORKBENCH,
      prdDomainIds.TENANT_ACCESS,
      prdDomainIds.SPATIAL_ASSETS,
      prdDomainIds.PROVIDER_DEVICES,
      prdDomainIds.CROP_MODEL,
      prdDomainIds.AGRI_TASKS,
      prdDomainIds.ALERTS,
      prdDomainIds.CONTROL,
      prdDomainIds.TRACE_REPORTS,
      prdDomainIds.AI_ASSISTANT,
      prdDomainIds.OBSERVABILITY,
    ])

    expect(
      prdDomainCoverage.every(
        (domain) => domain.prdRefs.length > 0 && domain.acceptanceRefs.length > 0,
      ),
    ).toBe(true)
  })

  it("creates every declared PRD core table in the D1 migration", () => {
    expect(findMissingPrdTables(migrationSql)).toEqual([])
    expect(getPrdCoverageSummary()).toMatchObject({
      domains: 11,
      implementedDomains: 1,
      foundationDomains: 10,
      tableCount: Object.values(prdCoreTables).length,
    })
  })

  it("keeps provider credentials out of table columns", () => {
    expect(findForbiddenCredentialColumns(migrationSql)).toEqual([])
    expect(migrationSql).toContain("credential_secret_ref TEXT NOT NULL")
    expect(migrationSql).toContain("token_secret_ref TEXT")
  })

  it("includes tenant ownership across core business tables", () => {
    for (const tableName of Object.values(prdCoreTables)) {
      const tableStart = migrationSql.indexOf(
        `CREATE TABLE IF NOT EXISTS ${tableName}`,
      )
      const nextCreate = migrationSql.indexOf("CREATE TABLE IF NOT EXISTS", tableStart + 1)
      const tableSql = migrationSql.slice(
        tableStart,
        nextCreate === -1 ? undefined : nextCreate,
      )

      expect(tableSql, `${tableName} must include tenant ownership`).toContain(
        "tenant_id",
      )
    }
  })

  it("models disabled-by-default control commands with audit fields", () => {
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS heos_control_commands")
    expect(migrationSql).toContain("idempotency_key TEXT NOT NULL")
    expect(migrationSql).toContain("expires_at TEXT NOT NULL")
    expect(migrationSql).toContain("approval_status TEXT NOT NULL DEFAULT 'disabled'")
    expect(migrationSql).toContain("audit_log_id TEXT")
  })

  it("models AI interaction audit and source attribution", () => {
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS heos_ai_interactions")
    expect(migrationSql).toContain("retrieval_sources_json TEXT NOT NULL DEFAULT '[]'")
    expect(migrationSql).toContain("cost_cents REAL NOT NULL DEFAULT 0")
    expect(migrationSql).toContain("human_confirmation_required INTEGER NOT NULL DEFAULT 0")
  })
})
