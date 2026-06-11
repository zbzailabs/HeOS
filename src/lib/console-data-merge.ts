import type { getConsoleDataWorkbench } from "../domain/console/workbench"

type ConsoleDataWorkbench = ReturnType<typeof getConsoleDataWorkbench>
type ConsoleDataResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
    }

export type ConsoleD1WorkbenchData = {
  projectAssets: ConsoleDataResult<ConsoleDataWorkbench["projectAssets"]>
  deviceLedger: ConsoleDataResult<ConsoleDataWorkbench["deviceLedger"]>
  alertCenter: ConsoleDataResult<Omit<ConsoleDataWorkbench["alertCenter"], "workflow">>
  agriTasks: ConsoleDataResult<Omit<ConsoleDataWorkbench["agriTasks"], "workflow">>
  traceArchives: ConsoleDataResult<
    Omit<ConsoleDataWorkbench["traceArchives"], "publicFields">
  >
  aiAssistant: ConsoleDataResult<
    Omit<
      ConsoleDataWorkbench["aiAssistant"],
      "operations" | "reviewQueue" | "sourcePolicy"
    >
  >
  aiReviewQueue: ConsoleDataResult<
    Omit<ConsoleDataWorkbench["aiAssistant"]["reviewQueue"], "emptyState"> & {
      items: Omit<
        ConsoleDataWorkbench["aiAssistant"]["reviewQueue"]["items"][number],
        "reviewActions"
      >[]
      emptyState?: string
    }
  >
  latestTelemetry: ConsoleDataWorkbench["telemetry"]["productionLatest"]
  aiProviderOperations?: Pick<
    ConsoleDataWorkbench["aiAssistant"]["operations"],
    | "recentProviderCalls"
    | "recentProviderFailures"
    | "averageLatencyMs"
    | "totalTokens"
    | "latestFailureCode"
  >
}

export function mergeConsoleD1WorkbenchData(
  base: ConsoleDataWorkbench,
  d1Results: ConsoleD1WorkbenchData,
): ConsoleDataWorkbench {
  const {
    projectAssets,
    deviceLedger,
    alertCenter,
    agriTasks,
    traceArchives,
    aiAssistant,
    aiReviewQueue,
    latestTelemetry,
    aiProviderOperations,
  } = d1Results

  if (
    !projectAssets.ok ||
    !deviceLedger.ok ||
    !alertCenter.ok ||
    !agriTasks.ok ||
    !traceArchives.ok ||
    !aiAssistant.ok ||
    !aiReviewQueue.ok
  ) {
    return base
  }

  const reviewActions = base.aiAssistant.reviewQueue.items[0]?.reviewActions ?? [
    { action: "confirm" as const, label: "确认" },
    { action: "reject" as const, label: "拒绝" },
  ]

  return {
    ...base,
    projectAssets: projectAssets.value,
    deviceLedger: deviceLedger.value,
    alertCenter: {
      ...alertCenter.value,
      workflow: base.alertCenter.workflow,
    },
    agriTasks: {
      ...agriTasks.value,
      workflow: base.agriTasks.workflow,
    },
    traceArchives: {
      ...traceArchives.value,
      items: traceArchives.value.items.filter(
        (archive) => archive.visibility === "public",
      ),
      publicFields: base.traceArchives.publicFields,
    },
    aiAssistant: {
      ...aiAssistant.value,
      reviewQueue: {
        ...aiReviewQueue.value,
        emptyState:
          aiReviewQueue.value.emptyState ?? base.aiAssistant.reviewQueue.emptyState,
        items: aiReviewQueue.value.items.map((item) => ({
          ...item,
          reviewActions,
        })),
      },
      operations: {
        ...base.aiAssistant.operations,
        ...aiProviderOperations,
        totalInteractions: aiAssistant.value.total,
        pendingReviewCount: aiReviewQueue.value.total,
      },
      sourcePolicy: base.aiAssistant.sourcePolicy,
    },
    telemetry: {
      ...base.telemetry,
      productionLatest: latestTelemetry,
      emptyState:
        latestTelemetry.length > 0
          ? "生产 D1 最近遥测已接入当前面板。"
          : base.telemetry.emptyState,
    },
  }
}
