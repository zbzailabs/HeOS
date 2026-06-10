import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { alertLevels, metricCodes, metricDefinitions } from "./enums"
import {
  baseStandardDictionaryEntries,
  createDictionaryReference,
  findDictionaryEntry,
  getDictionaryEntriesByCategory,
  standardDictionaryCategories,
  standardDictionaryChangeTable,
  standardDictionaryErrorCodes,
  standardDictionaryTable,
  validateDictionaryEntryUniqueness,
  validateDictionaryEnumConsistency,
} from "./dictionary"

const migrationSql = readFileSync(
  new URL("../../../db/migrations/0002_heos_standard_dictionary.sql", import.meta.url),
  "utf8",
)

function sorted(values: readonly string[]) {
  return [...values].sort()
}

describe("standard dictionary definitions", () => {
  it("contains the required base categories", () => {
    for (const category of Object.values(standardDictionaryCategories)) {
      expect(getDictionaryEntriesByCategory(category).length).toBeGreaterThan(0)
    }
  })

  it("keeps version, source, and effective time on every entry", () => {
    for (const entry of baseStandardDictionaryEntries) {
      expect(entry.code.length).toBeGreaterThan(0)
      expect(entry.version).toBe("v0.1")
      expect(entry.source).toBe("heos-prd")
      expect(entry.effectiveFrom).toBe("2026-06-10T00:00:00.000Z")
      expect(entry).toHaveProperty("effectiveTo")
    }
  })

  it("keeps category/code/version values unique", () => {
    expect(validateDictionaryEntryUniqueness()).toEqual({
      ok: true,
      status: 200,
      errors: [],
    })
  })

  it("returns a structured 400 error for duplicate values", () => {
    const duplicate = baseStandardDictionaryEntries[0]
    const result = validateDictionaryEntryUniqueness([
      ...baseStandardDictionaryEntries,
      { ...duplicate, id: "duplicate-id" },
    ])

    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
    expect(result.errors[0]).toMatchObject({
      status: 400,
      code: standardDictionaryErrorCodes.DUPLICATE_VALUE,
      table: standardDictionaryTable,
      dictionaryReference: {
        table: standardDictionaryTable,
        category: duplicate.category,
      },
      details: {
        duplicates: [`${duplicate.category}/${duplicate.code}/${duplicate.version}`],
      },
    })
  })

  it("keeps metric and alert-level dictionary values consistent with enums", () => {
    const metricEntries = getDictionaryEntriesByCategory(
      standardDictionaryCategories.METRIC,
    )
    const alertLevelEntries = getDictionaryEntriesByCategory(
      standardDictionaryCategories.ALERT_LEVEL,
    )

    expect(sorted(metricEntries.map((entry) => entry.code))).toEqual(
      sorted(Object.values(metricCodes)),
    )
    expect(sorted(alertLevelEntries.map((entry) => entry.code))).toEqual(
      sorted(Object.values(alertLevels)),
    )
    expect(validateDictionaryEnumConsistency()).toEqual({
      ok: true,
      status: 200,
      errors: [],
    })
  })

  it("returns a structured 400 error when dictionary and enums diverge", () => {
    const result = validateDictionaryEnumConsistency(
      baseStandardDictionaryEntries.filter(
        (entry) => entry.code !== metricCodes.AIR_TEMPERATURE,
      ),
    )

    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
    expect(result.errors[0]).toMatchObject({
      status: 400,
      code: standardDictionaryErrorCodes.ENUM_MISMATCH,
      table: standardDictionaryTable,
      category: standardDictionaryCategories.METRIC,
      dictionaryReference: {
        table: standardDictionaryTable,
        category: standardDictionaryCategories.METRIC,
      },
      details: {
        missing: [metricCodes.AIR_TEMPERATURE],
      },
    })
  })

  it("contains all metric default units in the unit dictionary", () => {
    const unitCodes = new Set(
      getDictionaryEntriesByCategory(standardDictionaryCategories.UNIT).map(
        (entry) => entry.code,
      ),
    )

    for (const definition of Object.values(metricDefinitions)) {
      expect(unitCodes.has(definition.defaultUnit)).toBe(true)
    }
  })

  it("can resolve a code-table reference", () => {
    expect(createDictionaryReference(standardDictionaryCategories.METRIC, "soil_ph", "v0.1"))
      .toEqual({
        table: standardDictionaryTable,
        category: standardDictionaryCategories.METRIC,
        code: "soil_ph",
        version: "v0.1",
      })
    expect(
      findDictionaryEntry(standardDictionaryCategories.METRIC, metricCodes.SOIL_PH),
    ).toMatchObject({
      code: metricCodes.SOIL_PH,
      unit: metricDefinitions[metricCodes.SOIL_PH].defaultUnit,
    })
  })
})

describe("standard dictionary D1 migration", () => {
  it("creates dictionary and change-record tables", () => {
    expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${standardDictionaryTable}`)
    expect(migrationSql).toContain(
      `CREATE TABLE IF NOT EXISTS ${standardDictionaryChangeTable}`,
    )
    expect(migrationSql).toContain("UNIQUE (category, code, version)")
    expect(migrationSql).toContain("change_type TEXT NOT NULL")
    expect(migrationSql).toContain("changed_fields_json TEXT NOT NULL")
  })

  it("uses D1-compatible column types", () => {
    expect(migrationSql).not.toMatch(/\bSERIAL\b/i)
    expect(migrationSql).not.toMatch(/\bVARCHAR\b/i)
    expect(migrationSql).not.toMatch(/\bJSONB\b/i)
    expect(migrationSql).toContain("id TEXT PRIMARY KEY")
    expect(migrationSql).toContain("effective_from TEXT NOT NULL")
    expect(migrationSql).toContain("effective_to TEXT")
  })

  it("seeds base entries and initial change records", () => {
    expect(migrationSql).toContain("INSERT OR IGNORE INTO heos_standard_dictionary")
    expect(migrationSql).toContain("INSERT OR IGNORE INTO heos_standard_dictionary_changes")
    expect(migrationSql).toContain("'crop', 'tomato'")
    expect(migrationSql).toContain("'metric', 'soil_ph'")
    expect(migrationSql).toContain("'alert_level', 'critical'")
    expect(migrationSql).toContain("'S0-01 initial dictionary baseline'")
    expect(migrationSql).toContain("FROM heos_standard_dictionary")

    for (const entry of baseStandardDictionaryEntries) {
      expect(migrationSql).toContain(`'${entry.id}'`)
    }
  })
})
