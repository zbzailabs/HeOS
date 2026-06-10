export type TraceDetailD1Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>
    }
  }
}

export type PublicTraceAgriRecord = {
  id: string
  agriTaskId: string
  taskTitle: string
  executedAt: string
  acceptanceResult: string
  notes: string | null
  photoAssetRefs: string[]
}

export type PublicTraceDetail = {
  id: string
  tenantId: string
  cropCycleId: string
  publicSlug: string
  visibility: "public"
  createdAt: string
  projectName: string
  cropCycleName: string
  inspectionSummary: string[]
  publicPayload: Record<string, unknown>
  agriRecords: PublicTraceAgriRecord[]
}

export function createD1TraceDetailRepository(db: TraceDetailD1Database) {
  return {
    async getPublicTraceDetail(input: { tenantId: string; slug: string }) {
      const traces = await queryRows<TraceDetailRow>(
        db,
        `SELECT
          trace.id,
          trace.tenant_id,
          trace.crop_cycle_id,
          trace.public_slug,
          trace.visibility,
          trace.public_payload_json,
          trace.created_at,
          cycle.name AS crop_cycle_name,
          project.name AS project_name
        FROM heos_trace_archives trace
        INNER JOIN heos_crop_cycles cycle
          ON cycle.id = trace.crop_cycle_id
          AND cycle.tenant_id = trace.tenant_id
        INNER JOIN heos_projects project
          ON project.id = cycle.project_id
          AND project.tenant_id = trace.tenant_id
        WHERE trace.tenant_id = ?
          AND trace.public_slug = ?
          AND trace.visibility = 'public'
        LIMIT 1`,
        [input.tenantId, input.slug],
      )
      const trace = traces[0]

      if (!trace) {
        return null
      }

      const records = await queryRows<TraceAgriRecordRow>(
        db,
        `SELECT
          record.id,
          record.agri_task_id,
          task.title AS task_title,
          record.executed_at,
          record.acceptance_result,
          record.notes,
          record.photo_asset_refs_json
        FROM heos_agri_task_records record
        INNER JOIN heos_agri_tasks task
          ON task.id = record.agri_task_id
          AND task.tenant_id = record.tenant_id
        WHERE record.tenant_id = ?
          AND task.crop_cycle_id = ?
        ORDER BY record.executed_at DESC, record.id DESC`,
        [input.tenantId, trace.crop_cycle_id],
      )
      const payload = parseJsonObject(trace.public_payload_json)

      return {
        id: trace.id,
        tenantId: trace.tenant_id,
        cropCycleId: trace.crop_cycle_id,
        publicSlug: trace.public_slug,
        visibility: "public" as const,
        createdAt: trace.created_at,
        projectName: trace.project_name,
        cropCycleName: trace.crop_cycle_name,
        inspectionSummary: readStringArray(payload.inspectionSummary),
        publicPayload: payload,
        agriRecords: records.map((record) => ({
          id: record.id,
          agriTaskId: record.agri_task_id,
          taskTitle: record.task_title,
          executedAt: record.executed_at,
          acceptanceResult: record.acceptance_result,
          notes: record.notes,
          photoAssetRefs: readStringArray(
            parseJson(record.photo_asset_refs_json),
          ),
        })),
      }
    },
  }
}

async function queryRows<T>(
  db: TraceDetailD1Database,
  sql: string,
  values: unknown[],
) {
  const result = await db.prepare(sql).bind(...values).all<T>()
  return result.results ?? []
}

type TraceDetailRow = {
  id: string
  tenant_id: string
  crop_cycle_id: string
  public_slug: string
  visibility: string
  public_payload_json: string
  created_at: string
  crop_cycle_name: string
  project_name: string
}

type TraceAgriRecordRow = {
  id: string
  agri_task_id: string
  task_title: string
  executed_at: string
  acceptance_result: string
  notes: string | null
  photo_asset_refs_json: string
}

function parseJson(value: string | null | undefined): unknown {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function parseJsonObject(value: string | null | undefined) {
  const parsed = parseJson(value)

  return isRecord(parsed) ? parsed : {}
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
