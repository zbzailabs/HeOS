import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import {
  classifyRenkeClientError,
  createRenkeD1SyncRepository,
  createRenkeRetryPlan,
  createRenkeSyncQueueMessage,
  createRenkeSyncSummary,
  findRenkeDeviceByAddr,
  persistRenkeSyncToD1,
  renkeDefaultBaseUrl,
  renkeDeviceAddr,
  renkeProviderId,
  renkeTenantId,
  resolveRenkeHistoryEndpoint,
  type RenkeD1Database,
  type RenkeRealtimeDevice,
} from "../../../../domain/renke/sync"
import { createTraceId } from "../../../../domain/telemetry/api"

type RenkeLoginResponse = {
  token?: string
  data?: {
    token?: string
  }
}

type RenkeSyncSuccessInput = {
  devices: RenkeRealtimeDevice[]
  targetDevice: RenkeRealtimeDevice
  realtimeDevices: RenkeRealtimeDevice[]
}

export const Route = createFileRoute("/api/providers/renke/sync")({
  server: {
    handlers: {
      POST: async () => {
        const traceId = createTraceId("renke")
        const startedAt = new Date().toISOString()

        try {
          const input = await fetchRenkeSyncInput()
          const finishedAt = new Date().toISOString()
          const summary = createRenkeSyncSummary({
            devices: input.realtimeDevices,
            now: finishedAt,
          })
          const persistence = await persistIfD1Available({
            traceId,
            startedAt,
            finishedAt,
            devices: [input.targetDevice],
            summary,
          })
          const historyEndpoint = resolveRenkeHistoryEndpoint(
            input.targetDevice.deviceType,
          )

          return json(
            {
              traceId,
              data: {
                ...summary,
                provider: renkeProviderId,
                targetDevice: {
                  deviceAddr: input.targetDevice.deviceAddr,
                  deviceName: input.targetDevice.deviceName,
                  deviceType: input.targetDevice.deviceType,
                  historyEndpoint,
                },
                persistence,
              },
            },
            { status: 200 },
          )
        } catch (error) {
          const failure = classifyRenkeClientError(error)
          const finishedAt = new Date().toISOString()
          const retry = createRenkeRetryPlan(failure, 1)
          const queueMessage = createRenkeSyncQueueMessage({
            traceId,
            attempt: retry.nextAttempt,
          })
          const queueResult = retry.shouldRetry
            ? await sendRetryMessageIfAvailable(queueMessage, retry.delaySeconds)
            : { status: "skipped" as const }
          const persistence = await recordFailureIfD1Available({
            traceId,
            startedAt,
            finishedAt,
            failure,
            queueMessageId:
              queueResult.status === "sent" ? queueMessage.traceId : null,
          })

          return json(
            {
              traceId,
              data: {
                total: 1,
                updated: 0,
                failed: 1,
                ts: new Date().toISOString(),
                status: failure.code,
                samples: [],
                failures: [failure],
                retry,
                queueMessage,
                queueResult,
                persistence,
              },
            },
            { status: failure.code === "auth_timeout" ? 401 : 502 },
          )
        }
      },
    },
  },
})

async function fetchRenkeSyncInput(): Promise<RenkeSyncSuccessInput> {
  const renkeEnv = env as {
    RENKE_BASE_URL?: string
    RENKE_LOGIN_NAME?: string
    RENKE_LOGIN_PASSWORD?: string
  }
  const baseUrl =
    renkeEnv.RENKE_BASE_URL ?? process.env.RENKE_BASE_URL ?? renkeDefaultBaseUrl
  const loginName = renkeEnv.RENKE_LOGIN_NAME ?? process.env.RENKE_LOGIN_NAME
  const loginPwd =
    renkeEnv.RENKE_LOGIN_PASSWORD ?? process.env.RENKE_LOGIN_PASSWORD

  if (!loginName || !loginPwd) {
    throw new Error("Renke credentials are not configured on the server.")
  }

  const loginResponse = await fetch(
    `${baseUrl}/api/v2.0/entrance/user/userLogin`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ loginName, loginPwd }),
    },
  )

  if (!loginResponse.ok) {
    throw new Error(`Renke auth failed with HTTP ${loginResponse.status}.`)
  }

  const loginJson = (await loginResponse.json()) as RenkeLoginResponse
  const token = loginJson.token ?? loginJson.data?.token

  if (!token) {
    throw new Error("Renke auth response did not include token.")
  }

  const devices = await fetchRenkeDeviceList(baseUrl, token)
  const targetDevice = findRenkeDeviceByAddr(devices, renkeDeviceAddr)

  if (!targetDevice) {
    throw new Error(`Renke device list did not include ${renkeDeviceAddr}.`)
  }

  const realtimeDevices = await fetchRenkeRealtimeDevices(baseUrl, token)
  const mergedRealtimeDevices = realtimeDevices.map((device) =>
    device.deviceAddr === renkeDeviceAddr
      ? {
          ...targetDevice,
          ...device,
          deviceType: targetDevice.deviceType ?? device.deviceType,
        }
      : device,
  )

  return {
    devices,
    targetDevice,
    realtimeDevices: mergedRealtimeDevices,
  }
}

async function sendRetryMessageIfAvailable(
  message: ReturnType<typeof createRenkeSyncQueueMessage>,
  delaySeconds: number,
) {
  const renkeEnv = env as {
    RENKE_SYNC_QUEUE?: {
      send(
        body: unknown,
        options?: {
          delaySeconds?: number
        },
      ): Promise<void>
    }
  }

  if (!renkeEnv.RENKE_SYNC_QUEUE) {
    return { status: "not_configured" as const }
  }

  await renkeEnv.RENKE_SYNC_QUEUE.send(message, { delaySeconds })
  return { status: "sent" as const }
}

async function fetchRenkeDeviceList(
  baseUrl: string,
  token: string,
): Promise<RenkeRealtimeDevice[]> {
  const deviceResponse = await fetch(
    `${baseUrl}/api/v2.0/entrance/device/getsysUserDevice`,
    {
      headers: { token },
    },
  )

  if (!deviceResponse.ok) {
    throw new Error(`Renke device list request failed with HTTP ${deviceResponse.status}.`)
  }

  return readRenkeDeviceArray(await deviceResponse.json())
}

async function fetchRenkeRealtimeDevices(
  baseUrl: string,
  token: string,
): Promise<RenkeRealtimeDevice[]> {
  const realtimeUrl = new URL(
    `${baseUrl}/api/v2.0/entrance/device/getRealTimeData`,
  )
  realtimeUrl.searchParams.set("deviceAddrs", renkeDeviceAddr)

  const realtimeResponse = await fetch(realtimeUrl, {
    headers: { token },
  })

  if (!realtimeResponse.ok) {
    throw new Error(`Renke realtime request failed with HTTP ${realtimeResponse.status}.`)
  }

  return readRenkeDeviceArray(await realtimeResponse.json())
}

function readRenkeDeviceArray(payload: unknown): RenkeRealtimeDevice[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      return payload.data as RenkeRealtimeDevice[]
    }

    if (Array.isArray(payload.rows)) {
      return payload.rows as RenkeRealtimeDevice[]
    }

    if (isRecord(payload.data)) {
      return [payload.data as RenkeRealtimeDevice]
    }
  }

  throw new Error("Renke device response shape is not recognized.")
}

function getHeosDb() {
  return (env as { HEOS_DB?: RenkeD1Database }).HEOS_DB ?? null
}

async function persistIfD1Available(input: {
  traceId: string
  startedAt: string
  finishedAt: string
  devices: readonly RenkeRealtimeDevice[]
  summary: ReturnType<typeof createRenkeSyncSummary>
}) {
  const db = getHeosDb()

  if (!db) {
    return { status: "skipped", reason: "HEOS_DB binding is not configured." }
  }

  try {
    return {
      status: "written",
      ...(await persistRenkeSyncToD1(createRenkeD1SyncRepository(db), input)),
    }
  } catch (error) {
    const failure = classifyRenkeClientError(error)
    return {
      status: "failed",
      errorCode: failure.code,
      errorMessage: failure.message,
    }
  }
}

async function recordFailureIfD1Available(input: {
  traceId: string
  startedAt: string
  finishedAt: string
  failure: ReturnType<typeof classifyRenkeClientError>
  queueMessageId: string | null
}) {
  const db = getHeosDb()

  if (!db) {
    return { status: "skipped", reason: "HEOS_DB binding is not configured." }
  }

  try {
    await createRenkeD1SyncRepository(db).recordSyncRun({
      traceId: input.traceId,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
      deviceCount: 0,
      successCount: 0,
      failedCount: 1,
      status: input.failure.code,
      errorCode: input.failure.code,
      errorMessage: input.failure.message,
      queueMessageId: input.queueMessageId,
    })

    return { status: "written", syncRunWrites: 1 }
  } catch (error) {
    const failure = classifyRenkeClientError(error)
    return {
      status: "failed",
      errorCode: failure.code,
      errorMessage: failure.message,
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}
