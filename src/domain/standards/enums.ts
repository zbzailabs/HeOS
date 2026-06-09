export const metricCodes = {
  AIR_TEMPERATURE: "air_temperature",
  AIR_HUMIDITY: "air_humidity",
  SOIL_TEMPERATURE: "soil_temperature",
  SOIL_MOISTURE: "soil_moisture",
  ILLUMINANCE: "illuminance",
  CO2: "co2",
  SOIL_EC: "soil_ec",
  SOIL_PH: "soil_ph",
  BATTERY_VOLTAGE: "battery_voltage",
  SIGNAL_STRENGTH: "signal_strength",
} as const

export type MetricCode = (typeof metricCodes)[keyof typeof metricCodes]

export const metricDefinitions = {
  [metricCodes.AIR_TEMPERATURE]: {
    label: "Air temperature",
    defaultUnit: "celsius",
  },
  [metricCodes.AIR_HUMIDITY]: {
    label: "Air humidity",
    defaultUnit: "percent",
  },
  [metricCodes.SOIL_TEMPERATURE]: {
    label: "Soil temperature",
    defaultUnit: "celsius",
  },
  [metricCodes.SOIL_MOISTURE]: {
    label: "Soil moisture",
    defaultUnit: "percent",
  },
  [metricCodes.ILLUMINANCE]: {
    label: "Illuminance",
    defaultUnit: "lux",
  },
  [metricCodes.CO2]: {
    label: "Carbon dioxide",
    defaultUnit: "ppm",
  },
  [metricCodes.SOIL_EC]: {
    label: "Soil electrical conductivity",
    defaultUnit: "us_cm",
  },
  [metricCodes.SOIL_PH]: {
    label: "Soil pH",
    defaultUnit: "ph",
  },
  [metricCodes.BATTERY_VOLTAGE]: {
    label: "Battery voltage",
    defaultUnit: "volt",
  },
  [metricCodes.SIGNAL_STRENGTH]: {
    label: "Signal strength",
    defaultUnit: "dbm",
  },
} as const satisfies Record<MetricCode, { label: string; defaultUnit: string }>

export const alertTypes = {
  OFFLINE: "offline",
  THRESHOLD: "threshold",
  PROVIDER_ERROR: "provider_error",
  CONTROL_FAILED: "control_failed",
  DATA_QUALITY: "data_quality",
} as const

export type AlertType = (typeof alertTypes)[keyof typeof alertTypes]

export const alertLevels = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const

export type AlertLevel = (typeof alertLevels)[keyof typeof alertLevels]

export const alertLevelDefinitions = {
  [alertLevels.INFO]: {
    order: 10,
    label: "Info",
  },
  [alertLevels.WARNING]: {
    order: 20,
    label: "Warning",
  },
  [alertLevels.CRITICAL]: {
    order: 30,
    label: "Critical",
  },
} as const satisfies Record<AlertLevel, { order: number; label: string }>

export const syncStatuses = {
  SUCCESS: "success",
  PARTIAL_SUCCESS: "partial_success",
  FAILED: "failed",
  RETRY_PENDING: "retry_pending",
  AUTH_TIMEOUT: "auth_timeout",
  SOURCE_TIMEOUT: "source_timeout",
  SCHEMA_MISMATCH: "schema_mismatch",
} as const

export type SyncStatus = (typeof syncStatuses)[keyof typeof syncStatuses]

export const telemetryQualities = {
  GOOD: "good",
  STALE: "stale",
  SUSPECT: "suspect",
  UNKNOWN: "unknown",
} as const

export type TelemetryQuality =
  (typeof telemetryQualities)[keyof typeof telemetryQualities]

export const deviceOnlineStatuses = {
  ONLINE: "online",
  OFFLINE: "offline",
  UNKNOWN: "unknown",
} as const

export type DeviceOnlineStatus =
  (typeof deviceOnlineStatuses)[keyof typeof deviceOnlineStatuses]

export function getMetricDefaultUnit(metricCode: MetricCode) {
  return metricDefinitions[metricCode].defaultUnit
}

export function getAlertLevelOrder(alertLevel: AlertLevel) {
  return alertLevelDefinitions[alertLevel].order
}

