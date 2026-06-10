import {
  alertLevels,
  alertTypes,
  deviceOnlineStatuses,
  type AlertLevel,
  type AlertType,
  type DeviceOnlineStatus,
} from "../standards/enums"

export const offlineThresholdSeconds = 300

export type DeviceStatusInput = {
  tenantId: string
  siteId: string
  deviceId: string
  deviceName: string
  supplierStatus?: string
  lastSeenAt: string | null
}

export type DeviceStatusView = DeviceStatusInput & {
  onlineStatus: DeviceOnlineStatus
  offlineSeconds: number | null
}

export type AlertView = {
  id: string
  tenantId: string
  siteId: string
  deviceId: string
  type: AlertType
  level: AlertLevel
  reason: string
  triggeredAt: string
  closedAt: string | null
  recoveredAt: string | null
}

export function resolveDeviceOnlineStatus(
  device: DeviceStatusInput,
  now = new Date().toISOString(),
): DeviceStatusView {
  if (!device.lastSeenAt) {
    return {
      ...device,
      onlineStatus: deviceOnlineStatuses.UNKNOWN,
      offlineSeconds: null,
    }
  }

  const offlineSeconds = Math.max(
    0,
    Math.floor((Date.parse(now) - Date.parse(device.lastSeenAt)) / 1000),
  )

  return {
    ...device,
    onlineStatus:
      offlineSeconds > offlineThresholdSeconds
        ? deviceOnlineStatuses.OFFLINE
        : deviceOnlineStatuses.ONLINE,
    offlineSeconds,
  }
}

export function createOfflineAlert(
  device: DeviceStatusView,
  now = new Date().toISOString(),
): AlertView | null {
  if (device.onlineStatus !== deviceOnlineStatuses.OFFLINE) {
    return null
  }

  return {
    id: `alert:${device.tenantId}:${device.siteId}:${device.deviceId}:offline`,
    tenantId: device.tenantId,
    siteId: device.siteId,
    deviceId: device.deviceId,
    type: alertTypes.OFFLINE,
    level: alertLevels.WARNING,
    reason: `最近一次数据时间超过 ${offlineThresholdSeconds} 秒，内部判定为离线。`,
    triggeredAt: now,
    closedAt: null,
    recoveredAt: null,
  }
}

export function closeOfflineAlert(
  alert: AlertView,
  recoveredAt = new Date().toISOString(),
): AlertView {
  return {
    ...alert,
    closedAt: recoveredAt,
    recoveredAt,
  }
}

export function getDeviceStatusDashboard(
  devices: readonly DeviceStatusInput[],
  now = new Date().toISOString(),
) {
  const statuses = devices.map((device) => resolveDeviceOnlineStatus(device, now))
  const alerts = statuses
    .map((device) => createOfflineAlert(device, now))
    .filter((alert): alert is AlertView => Boolean(alert))

  return {
    now,
    onlineCount: statuses.filter(
      (device) => device.onlineStatus === deviceOnlineStatuses.ONLINE,
    ).length,
    offlineCount: statuses.filter(
      (device) => device.onlineStatus === deviceOnlineStatuses.OFFLINE,
    ).length,
    unknownCount: statuses.filter(
      (device) => device.onlineStatus === deviceOnlineStatuses.UNKNOWN,
    ).length,
    devices: statuses,
    alerts,
  }
}
