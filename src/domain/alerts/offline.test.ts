import { describe, expect, it } from "vitest"

import { alertTypes, deviceOnlineStatuses } from "../standards/enums"
import {
  closeOfflineAlert,
  createOfflineAlert,
  getDeviceStatusDashboard,
  resolveDeviceOnlineStatus,
} from "./offline"

const baseDevice = {
  tenantId: "tenant-1",
  siteId: "site-1",
  deviceId: "device-1",
  deviceName: "设备一",
}

describe("offline alert rules", () => {
  it("marks devices offline after five minutes without data", () => {
    const status = resolveDeviceOnlineStatus(
      {
        ...baseDevice,
        lastSeenAt: "2026-06-10T07:54:59.000Z",
      },
      "2026-06-10T08:00:00.000Z",
    )

    expect(status.onlineStatus).toBe(deviceOnlineStatuses.OFFLINE)
    expect(status.offlineSeconds).toBe(301)
  })

  it("keeps devices online inside the five-minute window", () => {
    const status = resolveDeviceOnlineStatus(
      {
        ...baseDevice,
        lastSeenAt: "2026-06-10T07:55:00.000Z",
      },
      "2026-06-10T08:00:00.000Z",
    )

    expect(status.onlineStatus).toBe(deviceOnlineStatuses.ONLINE)
  })

  it("creates and closes offline alerts with recovery records", () => {
    const status = resolveDeviceOnlineStatus(
      {
        ...baseDevice,
        lastSeenAt: "2026-06-10T07:50:00.000Z",
      },
      "2026-06-10T08:00:00.000Z",
    )
    const alert = createOfflineAlert(status, "2026-06-10T08:00:00.000Z")

    expect(alert).toMatchObject({
      type: alertTypes.OFFLINE,
      triggeredAt: "2026-06-10T08:00:00.000Z",
      closedAt: null,
    })

    expect(
      alert && closeOfflineAlert(alert, "2026-06-10T08:03:00.000Z"),
    ).toMatchObject({
      recoveredAt: "2026-06-10T08:03:00.000Z",
      closedAt: "2026-06-10T08:03:00.000Z",
    })
  })

  it("summarizes device status for the console", () => {
    const dashboard = getDeviceStatusDashboard(
      [
        { ...baseDevice, lastSeenAt: "2026-06-10T07:59:00.000Z" },
        {
          ...baseDevice,
          deviceId: "device-2",
          lastSeenAt: "2026-06-10T07:30:00.000Z",
        },
      ],
      "2026-06-10T08:00:00.000Z",
    )

    expect(dashboard.onlineCount).toBe(1)
    expect(dashboard.offlineCount).toBe(1)
    expect(dashboard.alerts).toHaveLength(1)
  })
})
