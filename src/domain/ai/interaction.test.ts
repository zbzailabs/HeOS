import { describe, expect, it } from "vitest"

import {
  aiAuditActions,
  aiInteractionErrorCodes,
  aiScenarios,
  createAiInteractionWritePlan,
  type AiInteractionWritePlanInput,
} from "./interaction"

const baseInput = {
  traceId: "trace-ai-001",
  tenantId: "tenant-tenglong-school",
  userId: "user-tenglong-admin",
  scenario: aiScenarios.ALERT_EXPLANATION,
  modelName: "gpt-4.1-mini",
  inputSummary: "解释 40406816 设备离线风险",
  outputSummary: "建议先检查供应商在线状态和现场供电。",
  retrievalSources: [
    {
      tenantId: "tenant-tenglong-school",
      table: "heos_devices",
      targetId: "device-renke-40406816",
      title: "Renke 40406816",
      permissionCode: "device:telemetry:read",
    },
  ],
  costCents: 3,
  humanConfirmationRequired: true,
  createdAt: "2026-06-11T08:30:00.000Z",
} as const satisfies AiInteractionWritePlanInput

describe("AI interaction write plan", () => {
  it("rejects AI records without authorized retrieval sources", () => {
    const result = createAiInteractionWritePlan({
      ...baseInput,
      retrievalSources: [],
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: aiInteractionErrorCodes.MISSING_RETRIEVAL_SOURCE,
        },
      ],
    })
  })

  it("rejects retrieval sources from another tenant", () => {
    const result = createAiInteractionWritePlan({
      ...baseInput,
      retrievalSources: [
        {
          ...baseInput.retrievalSources[0],
          tenantId: "tenant-other",
        },
      ],
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: aiInteractionErrorCodes.UNAUTHORIZED_RETRIEVAL_SOURCE,
          details: {
            tenantId: "tenant-tenglong-school",
            sourceTenantId: "tenant-other",
          },
        },
      ],
    })
  })

  it("requires human confirmation for high-risk advice scenarios", () => {
    const result = createAiInteractionWritePlan({
      ...baseInput,
      scenario: aiScenarios.AGRI_ADVICE,
      humanConfirmationRequired: false,
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [
        {
          code: aiInteractionErrorCodes.HUMAN_CONFIRMATION_REQUIRED,
        },
      ],
    })
  })

  it("creates AI interaction and audit write plans with source metadata", () => {
    const result = createAiInteractionWritePlan(baseInput)

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        aiInteraction: {
          table: "heos_ai_interactions",
          record: {
            traceId: "trace-ai-001",
            tenantId: "tenant-tenglong-school",
            scenario: aiScenarios.ALERT_EXPLANATION,
            humanConfirmationRequired: 1,
            retrievalSourcesJson: JSON.stringify(baseInput.retrievalSources),
          },
        },
        auditLog: {
          table: "heos_audit_logs",
          record: {
            traceId: "trace-ai-001",
            action: aiAuditActions.INTERACTION_CREATE,
            targetType: "heos_ai_interactions",
            result: "success",
            source: "heos-ai",
            metadataJson: JSON.stringify({
              scenario: aiScenarios.ALERT_EXPLANATION,
              modelName: "gpt-4.1-mini",
              retrievalSourceCount: 1,
              humanConfirmationRequired: true,
            }),
          },
        },
      },
    })
  })
})
