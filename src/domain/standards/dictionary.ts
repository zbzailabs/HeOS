import { alertLevels, metricCodes, metricDefinitions } from "./enums"

export const standardDictionaryTable = "heos_standard_dictionary"
export const standardDictionaryChangeTable =
  "heos_standard_dictionary_changes"

export const standardDictionaryVersion = "v0.1"
export const standardDictionaryEffectiveFrom = "2026-06-10T00:00:00.000Z"

export const standardDictionaryCategories = {
  CROP: "crop",
  GROWTH_STAGE: "growth_stage",
  METRIC: "metric",
  UNIT: "unit",
  DEVICE_CAPABILITY: "device_capability",
  ALERT_LEVEL: "alert_level",
} as const

export type StandardDictionaryCategory =
  (typeof standardDictionaryCategories)[keyof typeof standardDictionaryCategories]

export type StandardDictionaryStatus = "active" | "deprecated"

export type StandardDictionaryEntry = {
  id: string
  category: StandardDictionaryCategory
  code: string
  label: string
  description: string
  unit: string | null
  version: string
  source: string
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
  status: StandardDictionaryStatus
  sortOrder: number
}

export type DictionaryReference = {
  table: typeof standardDictionaryTable
  category: StandardDictionaryCategory
  code?: string
  version?: string
}

export const standardDictionaryErrorCodes = {
  DUPLICATE_VALUE: "STANDARD_DICTIONARY_DUPLICATE_VALUE",
  ENUM_MISMATCH: "STANDARD_DICTIONARY_ENUM_MISMATCH",
  UNIT_REFERENCE_MISSING: "STANDARD_DICTIONARY_UNIT_REFERENCE_MISSING",
} as const

type StandardDictionaryErrorCode =
  (typeof standardDictionaryErrorCodes)[keyof typeof standardDictionaryErrorCodes]

export type StandardDictionaryValidationError = {
  status: 400
  code: StandardDictionaryErrorCode
  message: string
  table: typeof standardDictionaryTable
  category: StandardDictionaryCategory
  dictionaryReference: DictionaryReference
  details: {
    duplicates?: string[]
    expected?: string[]
    actual?: string[]
    missing?: string[]
    extra?: string[]
  }
}

export type StandardDictionaryValidationResult = {
  ok: boolean
  status: 200 | 400
  errors: StandardDictionaryValidationError[]
}

const sourceRef =
  "docs/heos-prd/06-标准对齐任务清单-v0.1.md#S0-01"

const baseEntryDefaults = {
  version: standardDictionaryVersion,
  source: "heos-prd",
  sourceRef,
  effectiveFrom: standardDictionaryEffectiveFrom,
  effectiveTo: null,
  status: "active",
} as const

function createEntry(
  entry: Omit<
    StandardDictionaryEntry,
    | "version"
    | "source"
    | "sourceRef"
    | "effectiveFrom"
    | "effectiveTo"
    | "status"
  >,
): StandardDictionaryEntry {
  return {
    ...entry,
    ...baseEntryDefaults,
  }
}

export const baseStandardDictionaryEntries = [
  createEntry({
    id: "std-dict-crop-tomato-v0-1",
    category: standardDictionaryCategories.CROP,
    code: "tomato",
    label: "番茄",
    description: "设施种植高频果菜作物。",
    unit: null,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-crop-strawberry-v0-1",
    category: standardDictionaryCategories.CROP,
    code: "strawberry",
    label: "草莓",
    description: "设施种植高频浆果作物。",
    unit: null,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-crop-cucumber-v0-1",
    category: standardDictionaryCategories.CROP,
    code: "cucumber",
    label: "黄瓜",
    description: "设施种植高频瓜类作物。",
    unit: null,
    sortOrder: 30,
  }),
  createEntry({
    id: "std-dict-crop-rice-v0-1",
    category: standardDictionaryCategories.CROP,
    code: "rice",
    label: "水稻",
    description: "长三角常见粮食作物。",
    unit: null,
    sortOrder: 40,
  }),
  createEntry({
    id: "std-dict-crop-lettuce-v0-1",
    category: standardDictionaryCategories.CROP,
    code: "lettuce",
    label: "生菜",
    description: "设施叶菜作物。",
    unit: null,
    sortOrder: 50,
  }),
  createEntry({
    id: "std-dict-growth-stage-seedling-v0-1",
    category: standardDictionaryCategories.GROWTH_STAGE,
    code: "seedling",
    label: "苗期",
    description: "出苗至定植前阶段。",
    unit: null,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-growth-stage-vegetative-v0-1",
    category: standardDictionaryCategories.GROWTH_STAGE,
    code: "vegetative",
    label: "营养生长期",
    description: "植株营养器官快速生长阶段。",
    unit: null,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-growth-stage-flowering-v0-1",
    category: standardDictionaryCategories.GROWTH_STAGE,
    code: "flowering",
    label: "开花期",
    description: "花芽分化和开花阶段。",
    unit: null,
    sortOrder: 30,
  }),
  createEntry({
    id: "std-dict-growth-stage-fruiting-v0-1",
    category: standardDictionaryCategories.GROWTH_STAGE,
    code: "fruiting",
    label: "结果期",
    description: "果实膨大和成熟阶段。",
    unit: null,
    sortOrder: 40,
  }),
  createEntry({
    id: "std-dict-growth-stage-harvest-v0-1",
    category: standardDictionaryCategories.GROWTH_STAGE,
    code: "harvest",
    label: "采收期",
    description: "达到采收标准并进入采收作业阶段。",
    unit: null,
    sortOrder: 50,
  }),
  createEntry({
    id: "std-dict-unit-celsius-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "celsius",
    label: "摄氏度",
    description: "温度单位，符号 C。",
    unit: null,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-unit-percent-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "percent",
    label: "百分比",
    description: "相对比例单位，符号 %。",
    unit: null,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-unit-lux-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "lux",
    label: "勒克斯",
    description: "照度单位，符号 lx。",
    unit: null,
    sortOrder: 30,
  }),
  createEntry({
    id: "std-dict-unit-ppm-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "ppm",
    label: "百万分比浓度",
    description: "浓度单位 ppm。",
    unit: null,
    sortOrder: 40,
  }),
  createEntry({
    id: "std-dict-unit-us-cm-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "us_cm",
    label: "微西门子每厘米",
    description: "电导率单位 uS/cm。",
    unit: null,
    sortOrder: 50,
  }),
  createEntry({
    id: "std-dict-unit-ph-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "ph",
    label: "酸碱度",
    description: "pH 无量纲指标。",
    unit: null,
    sortOrder: 60,
  }),
  createEntry({
    id: "std-dict-unit-volt-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "volt",
    label: "伏特",
    description: "电压单位，符号 V。",
    unit: null,
    sortOrder: 70,
  }),
  createEntry({
    id: "std-dict-unit-dbm-v0-1",
    category: standardDictionaryCategories.UNIT,
    code: "dbm",
    label: "毫瓦分贝",
    description: "信号强度单位 dBm。",
    unit: null,
    sortOrder: 80,
  }),
  createEntry({
    id: "std-dict-metric-air-temperature-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.AIR_TEMPERATURE,
    label: "空气温度",
    description: "空气温度遥测指标。",
    unit: metricDefinitions[metricCodes.AIR_TEMPERATURE].defaultUnit,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-metric-air-humidity-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.AIR_HUMIDITY,
    label: "空气湿度",
    description: "空气相对湿度遥测指标。",
    unit: metricDefinitions[metricCodes.AIR_HUMIDITY].defaultUnit,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-metric-soil-temperature-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.SOIL_TEMPERATURE,
    label: "土壤温度",
    description: "土壤温度遥测指标。",
    unit: metricDefinitions[metricCodes.SOIL_TEMPERATURE].defaultUnit,
    sortOrder: 30,
  }),
  createEntry({
    id: "std-dict-metric-soil-moisture-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.SOIL_MOISTURE,
    label: "土壤湿度",
    description: "土壤含水率遥测指标。",
    unit: metricDefinitions[metricCodes.SOIL_MOISTURE].defaultUnit,
    sortOrder: 40,
  }),
  createEntry({
    id: "std-dict-metric-illuminance-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.ILLUMINANCE,
    label: "照度",
    description: "环境照度遥测指标。",
    unit: metricDefinitions[metricCodes.ILLUMINANCE].defaultUnit,
    sortOrder: 50,
  }),
  createEntry({
    id: "std-dict-metric-co2-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.CO2,
    label: "二氧化碳浓度",
    description: "空气二氧化碳浓度遥测指标。",
    unit: metricDefinitions[metricCodes.CO2].defaultUnit,
    sortOrder: 60,
  }),
  createEntry({
    id: "std-dict-metric-soil-ec-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.SOIL_EC,
    label: "土壤电导率",
    description: "土壤电导率遥测指标。",
    unit: metricDefinitions[metricCodes.SOIL_EC].defaultUnit,
    sortOrder: 70,
  }),
  createEntry({
    id: "std-dict-metric-soil-ph-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.SOIL_PH,
    label: "土壤酸碱度",
    description: "土壤 pH 遥测指标。",
    unit: metricDefinitions[metricCodes.SOIL_PH].defaultUnit,
    sortOrder: 80,
  }),
  createEntry({
    id: "std-dict-metric-battery-voltage-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.BATTERY_VOLTAGE,
    label: "电池电压",
    description: "设备电池电压遥测指标。",
    unit: metricDefinitions[metricCodes.BATTERY_VOLTAGE].defaultUnit,
    sortOrder: 90,
  }),
  createEntry({
    id: "std-dict-metric-signal-strength-v0-1",
    category: standardDictionaryCategories.METRIC,
    code: metricCodes.SIGNAL_STRENGTH,
    label: "信号强度",
    description: "设备通信信号强度遥测指标。",
    unit: metricDefinitions[metricCodes.SIGNAL_STRENGTH].defaultUnit,
    sortOrder: 100,
  }),
  createEntry({
    id: "std-dict-device-capability-telemetry-v0-1",
    category: standardDictionaryCategories.DEVICE_CAPABILITY,
    code: "telemetry",
    label: "遥测上报",
    description: "设备支持遥测采样上报。",
    unit: null,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-device-capability-offline-detection-v0-1",
    category: standardDictionaryCategories.DEVICE_CAPABILITY,
    code: "offline_detection",
    label: "离线判定",
    description: "设备支持离线状态判定。",
    unit: null,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-device-capability-threshold-alert-v0-1",
    category: standardDictionaryCategories.DEVICE_CAPABILITY,
    code: "threshold_alert",
    label: "阈值告警",
    description: "设备数据支持阈值告警。",
    unit: null,
    sortOrder: 30,
  }),
  createEntry({
    id: "std-dict-device-capability-provider-sync-v0-1",
    category: standardDictionaryCategories.DEVICE_CAPABILITY,
    code: "provider_sync",
    label: "供应商同步",
    description: "设备支持供应商平台同步。",
    unit: null,
    sortOrder: 40,
  }),
  createEntry({
    id: "std-dict-alert-level-info-v0-1",
    category: standardDictionaryCategories.ALERT_LEVEL,
    code: alertLevels.INFO,
    label: "提示",
    description: "无需立即处置的信息提醒。",
    unit: null,
    sortOrder: 10,
  }),
  createEntry({
    id: "std-dict-alert-level-warning-v0-1",
    category: standardDictionaryCategories.ALERT_LEVEL,
    code: alertLevels.WARNING,
    label: "预警",
    description: "需要人工关注的风险事件。",
    unit: null,
    sortOrder: 20,
  }),
  createEntry({
    id: "std-dict-alert-level-critical-v0-1",
    category: standardDictionaryCategories.ALERT_LEVEL,
    code: alertLevels.CRITICAL,
    label: "严重",
    description: "需要优先处置的严重事件。",
    unit: null,
    sortOrder: 30,
  }),
]

export function createDictionaryReference(
  category: StandardDictionaryCategory,
  code?: string,
  version?: string,
): DictionaryReference {
  return {
    table: standardDictionaryTable,
    category,
    ...(code ? { code } : {}),
    ...(version ? { version } : {}),
  }
}

export function getDictionaryEntriesByCategory(
  category: StandardDictionaryCategory,
  entries: readonly StandardDictionaryEntry[] = baseStandardDictionaryEntries,
) {
  return entries
    .filter((entry) => entry.category === category)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}

export function findDictionaryEntry(
  category: StandardDictionaryCategory,
  code: string,
  entries: readonly StandardDictionaryEntry[] = baseStandardDictionaryEntries,
) {
  return entries.find(
    (entry) => entry.category === category && entry.code === code,
  )
}

export function validateDictionaryEntryUniqueness(
  entries: readonly StandardDictionaryEntry[] = baseStandardDictionaryEntries,
): StandardDictionaryValidationResult {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    const key = getEntryKey(entry)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)

  if (duplicates.length === 0) {
    return { ok: true, status: 200, errors: [] }
  }

  return {
    ok: false,
    status: 400,
    errors: [
      createValidationError({
        code: standardDictionaryErrorCodes.DUPLICATE_VALUE,
        message:
          "StandardDictionary contains duplicate category/code/version values.",
        category: entries.find((entry) => getEntryKey(entry) === duplicates[0])
          ?.category ?? standardDictionaryCategories.METRIC,
        details: { duplicates },
      }),
    ],
  }
}

export function validateDictionaryEnumConsistency(
  entries: readonly StandardDictionaryEntry[] = baseStandardDictionaryEntries,
): StandardDictionaryValidationResult {
  const errors: StandardDictionaryValidationError[] = []

  pushSetComparisonError({
    errors,
    category: standardDictionaryCategories.METRIC,
    expected: Object.values(metricCodes),
    actual: getCodesByCategory(standardDictionaryCategories.METRIC, entries),
    message: "Metric dictionary codes must match MetricCode enum values.",
  })

  pushSetComparisonError({
    errors,
    category: standardDictionaryCategories.ALERT_LEVEL,
    expected: Object.values(alertLevels),
    actual: getCodesByCategory(standardDictionaryCategories.ALERT_LEVEL, entries),
    message: "Alert level dictionary codes must match AlertLevel enum values.",
  })

  const unitCodes = new Set(
    getCodesByCategory(standardDictionaryCategories.UNIT, entries),
  )
  const metricUnits = new Set(
    Object.values(metricDefinitions).map((definition) => definition.defaultUnit),
  )
  const missingUnits = [...metricUnits]
    .filter((unit) => !unitCodes.has(unit))
    .sort()

  if (missingUnits.length > 0) {
    errors.push(
      createValidationError({
        code: standardDictionaryErrorCodes.UNIT_REFERENCE_MISSING,
        message: "Metric dictionary units must exist in the unit dictionary.",
        category: standardDictionaryCategories.UNIT,
        details: { missing: missingUnits },
      }),
    )
  }

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? 200 : 400,
    errors,
  }
}

function getEntryKey(entry: StandardDictionaryEntry) {
  return `${entry.category}/${entry.code}/${entry.version}`
}

function getCodesByCategory(
  category: StandardDictionaryCategory,
  entries: readonly StandardDictionaryEntry[],
) {
  return entries
    .filter((entry) => entry.category === category)
    .map((entry) => entry.code)
    .sort()
}

function pushSetComparisonError({
  errors,
  category,
  expected,
  actual,
  message,
}: {
  errors: StandardDictionaryValidationError[]
  category: StandardDictionaryCategory
  expected: readonly string[]
  actual: readonly string[]
  message: string
}) {
  const sortedExpected = [...expected].sort()
  const sortedActual = [...actual].sort()
  const missing = sortedExpected.filter((code) => !sortedActual.includes(code))
  const extra = sortedActual.filter((code) => !sortedExpected.includes(code))

  if (missing.length === 0 && extra.length === 0) {
    return
  }

  errors.push(
    createValidationError({
      code: standardDictionaryErrorCodes.ENUM_MISMATCH,
      message,
      category,
      details: {
        expected: sortedExpected,
        actual: sortedActual,
        missing,
        extra,
      },
    }),
  )
}

function createValidationError({
  code,
  message,
  category,
  details,
}: {
  code: StandardDictionaryErrorCode
  message: string
  category: StandardDictionaryCategory
  details: StandardDictionaryValidationError["details"]
}): StandardDictionaryValidationError {
  return {
    status: 400,
    code,
    message,
    table: standardDictionaryTable,
    category,
    dictionaryReference: createDictionaryReference(category),
    details,
  }
}
