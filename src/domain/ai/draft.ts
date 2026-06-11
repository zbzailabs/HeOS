import {
  aiScenarios,
  createAiInteractionWritePlan,
  type AiInteractionResult,
  type AiInteractionWritePlanInput,
  type AiRetrievalSource,
  type AiScenario,
} from "./interaction"

export type AiAuthorizedDraft = {
  scenario: AiScenario
  sourceTitle: string
  recommendation: string
  confirmationNotice: string
}

export type AiAuthorizedDraftInput = {
  traceId: string
  tenantId: string
  userId: string | null
  scenario: AiScenario
  source: AiRetrievalSource | null
  humanConfirmationRequired: boolean
  now: string
}

export type AiAuthorizedDraftPlan = {
  draft: AiAuthorizedDraft
  interactionInput: AiInteractionWritePlanInput
}

export function createAiAuthorizedDraftInput(
  input: AiAuthorizedDraftInput,
): AiInteractionResult<AiAuthorizedDraftPlan> {
  const retrievalSources = input.source ? [input.source] : []
  const draft = createDraft(input.scenario, input.source)
  const interactionInput: AiInteractionWritePlanInput = {
    traceId: input.traceId,
    tenantId: input.tenantId,
    userId: input.userId,
    scenario: input.scenario,
    modelName: "heos-draft-orchestrator",
    inputSummary: `基于授权来源生成 ${scenarioLabel(input.scenario)} 草稿：${draft.sourceTitle}`,
    outputSummary: `${draft.recommendation} 仅作为人工复核草稿，确认后进入业务处理。`,
    retrievalSources,
    costCents: 0,
    humanConfirmationRequired: input.humanConfirmationRequired,
    createdAt: input.now,
  }
  const validation = createAiInteractionWritePlan(interactionInput)

  if (!validation.ok) {
    return validation
  }

  return {
    ok: true,
    status: 200,
    value: {
      draft,
      interactionInput,
    },
  }
}

function createDraft(
  scenario: AiScenario,
  source: AiRetrievalSource | null,
): AiAuthorizedDraft {
  const sourceTitle = source?.title ?? "未提供授权来源"

  return {
    scenario,
    sourceTitle,
    recommendation: recommendationForScenario(scenario, sourceTitle),
    confirmationNotice: highRiskScenario(scenario)
      ? "高风险建议已进入人工确认。"
      : "低风险建议已生成。",
  }
}

function recommendationForScenario(scenario: AiScenario, sourceTitle: string) {
  switch (scenario) {
    case aiScenarios.ALERT_EXPLANATION:
      return `请复核 ${sourceTitle} 的设备状态、阈值规则和最近采样时间。`
    case aiScenarios.AGRI_ADVICE:
      return `请结合 ${sourceTitle} 的作物阶段、现场照片和农事记录安排处理。`
    case aiScenarios.REPORT_SUMMARY:
      return `请依据 ${sourceTitle} 汇总项目进展、风险和下一步工作。`
    case aiScenarios.STAGE_ADVICE:
      return `请根据 ${sourceTitle} 复核作物阶段指标和任务模板。`
    case aiScenarios.CROP_QA:
      return `请基于 ${sourceTitle} 的授权资料回答作物问题。`
  }
}

function scenarioLabel(scenario: AiScenario) {
  switch (scenario) {
    case aiScenarios.ALERT_EXPLANATION:
      return "告警解释"
    case aiScenarios.AGRI_ADVICE:
      return "农事建议"
    case aiScenarios.REPORT_SUMMARY:
      return "报告摘要"
    case aiScenarios.STAGE_ADVICE:
      return "阶段建议"
    case aiScenarios.CROP_QA:
      return "作物问答"
  }
}

function highRiskScenario(scenario: AiScenario) {
  return (
    scenario === aiScenarios.ALERT_EXPLANATION ||
    scenario === aiScenarios.AGRI_ADVICE ||
    scenario === aiScenarios.REPORT_SUMMARY
  )
}
