import { describe, expect, it } from "vitest"

import { aiScenarios } from "./interaction"
import { createAiAuthorizedDraftInput } from "./draft"

const alertSource = {
  tenantId: "tenant-tenglong-school",
  table: "heos_alerts",
  targetId: "alert-soil-ph-critical",
  title: "soil_ph critical 告警",
  permissionCode: "alert:read",
}

describe("AI authorized draft orchestration", () => {
  it("creates a high-risk interaction input from one authorized source", () => {
    const result = createAiAuthorizedDraftInput({
      traceId: "trace-ai-draft-001",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      scenario: aiScenarios.ALERT_EXPLANATION,
      source: alertSource,
      humanConfirmationRequired: true,
      now: "2026-06-11T12:20:00.000Z",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        draft: {
          sourceTitle: "soil_ph critical 告警",
          confirmationNotice: "高风险建议已进入人工确认。",
        },
        interactionInput: {
          scenario: aiScenarios.ALERT_EXPLANATION,
          retrievalSources: [alertSource],
          humanConfirmationRequired: true,
          costCents: 0,
        },
      },
    })
    expect(result.ok && result.value.interactionInput.inputSummary).toContain(
      "soil_ph critical 告警",
    )
    expect(result.ok && result.value.interactionInput.outputSummary).toContain(
      "仅作为人工复核草稿",
    )
  })

  it("rejects a draft source from another tenant", () => {
    const result = createAiAuthorizedDraftInput({
      traceId: "trace-ai-draft-002",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      scenario: aiScenarios.AGRI_ADVICE,
      source: {
        ...alertSource,
        tenantId: "tenant-other",
      },
      humanConfirmationRequired: true,
      now: "2026-06-11T12:20:00.000Z",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [{ code: "AI_UNAUTHORIZED_RETRIEVAL_SOURCE" }],
    })
  })
})
