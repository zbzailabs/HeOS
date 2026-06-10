import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import {
  classifyRenkeClientError,
  createRenkeSyncSummary,
  renkeDefaultBaseUrl,
  renkeDeviceAddr,
  type RenkeRealtimeDevice,
} from "../../../../domain/renke/sync"
import { createTraceId } from "../../../../domain/telemetry/api"

type RenkeLoginResponse = {
  token?: string
  data?: {
    token?: string
  }
}

export const Route = createFileRoute("/api/providers/renke/sync")({
  server: {
    handlers: {
      POST: async () => {
        const traceId = createTraceId("renke")

        try {
          const devices = await fetchRenkeRealtimeDevices()
          const summary = createRenkeSyncSummary({ devices })

          return json({ traceId, data: summary }, { status: 200 })
        } catch (error) {
          const failure = classifyRenkeClientError(error)

          return json(
            {
              traceId,
              data: {
                total: 1,
                updated: 0,
                failed: 1,
                ts: new Date().toISOString(),
                status: "failed",
                samples: [],
                failures: [failure],
              },
            },
            { status: failure.code === "auth_timeout" ? 401 : 502 },
          )
        }
      },
    },
  },
})

async function fetchRenkeRealtimeDevices(): Promise<RenkeRealtimeDevice[]> {
  const baseUrl = process.env.RENKE_BASE_URL ?? renkeDefaultBaseUrl
  const loginName = process.env.RENKE_LOGIN_NAME
  const loginPwd = process.env.RENKE_LOGIN_PASSWORD

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

  const payload = (await realtimeResponse.json()) as
    | { data?: RenkeRealtimeDevice[] | RenkeRealtimeDevice }
    | RenkeRealtimeDevice[]

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data) {
    return [payload.data]
  }

  throw new Error("Renke realtime response shape is not recognized.")
}
