# HeOS DeepSeek Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已接入 DeepSeek API 和 AI 人工确认队列的基础上，完成生产密钥配置后的真实调用复测、输出质量约束、用量观测和后台操作体验加固。

**Architecture:** 继续使用 TanStack Start + Cloudflare Workers + D1。DeepSeek 仍只在服务端调用，D1 记录交互、审计、人工确认和运行指标；后台 `/console` 展示 AI 建议、待确认项、失败原因和用量摘要。

**Tech Stack:** TypeScript, TanStack Start, Cloudflare Workers, Cloudflare D1, DeepSeek Chat Completions API, Vitest, Playwright, pnpm.

---

## Current Baseline

- #49 已完成一期生产端到端验收。
- #55 已完成 DeepSeek AI 建议与人工确认 API。
- #56 已完成后台 AI 待确认入口。
- #57 已完成 AI 建议闭环生产核验文档、D1 migration 和 Worker 部署。
- 当前生产环境尚未配置 `DEEPSEEK_API_KEY`，草稿接口返回受控 `DEEPSEEK_API_KEY_MISSING`。
- 当前 `main` 与 `origin/main` 一致，无 open GitHub Issue。
- 飞书项目 `7015640531` 当前状态为“技术方案中”。

## Recommended Issue Split

1. `[heos-prod] S4-05 DeepSeek 生产密钥配置与真实调用复测`
2. `[heos-prod] S2-13 DeepSeek 输出质量与安全边界`
3. `[heos-prod] S3-09 AI 待确认入口操作体验加固`
4. `[heos-prod] S4-06 AI 用量、失败和延迟观测`

---

### Task 1: S4-05 DeepSeek Production Secret and Real Call Verification

**Files:**
- Create: `docs/specs/S4-05-deepseek-production-verification.md`
- Modify: `docs/specs/S4-04-ai-review-production-verification.md`

- [ ] **Step 1: Configure production secret**

Run:

```bash
pnpm exec wrangler secret put DEEPSEEK_API_KEY
```

Expected: Wrangler confirms the secret update. Do not print or store the key value.

- [ ] **Step 2: Verify secret presence**

Run:

```bash
pnpm exec wrangler secret list
```

Expected: output includes `DEEPSEEK_API_KEY`.

- [ ] **Step 3: Run production DeepSeek draft**

Run:

```bash
curl -sS https://app.yunhe.ai/api/core/ai-interactions \
  -H 'content-type: application/json' \
  --data '{
    "mode": "draft",
    "tenantId": "tenant-tenglong-school",
    "userId": "user-tenglong-admin",
    "scenario": "alert_explanation",
    "source": {
      "tenantId": "tenant-tenglong-school",
      "table": "heos_alerts",
      "targetId": "alert-soil-ph-critical",
      "title": "soil_ph critical 告警",
      "permissionCode": "alert:read"
    },
    "humanConfirmationRequired": true
  }'
```

Expected: response includes `traceId`, `interactionId`, `auditLogId`, `draft.recommendation`, and no `DEEPSEEK_API_KEY_MISSING`.

- [ ] **Step 4: Confirm the generated suggestion**

Run:

```bash
curl -sS https://app.yunhe.ai/api/core/ai-reviews \
  -H 'content-type: application/json' \
  --data '{
    "tenantId": "tenant-tenglong-school",
    "interactionId": "<interactionId-from-step-3>",
    "action": "confirm",
    "note": "生产真实 DeepSeek 调用复测确认。"
  }'
```

Expected: response includes `reviewActionId` and `statusAfterAction=confirmed`.

- [ ] **Step 5: Record verification**

Create `docs/specs/S4-05-deepseek-production-verification.md` with:

- secret configured timestamp
- draft response evidence with key value removed
- review response evidence
- D1 count check
- remaining risks

Commit:

```bash
git add docs/specs/S4-05-deepseek-production-verification.md docs/specs/S4-04-ai-review-production-verification.md
git commit -m "docs: record DeepSeek production verification"
```

---

### Task 2: S2-13 DeepSeek Output Quality and Safety Boundary

**Files:**
- Create: `docs/specs/S2-13-deepseek-output-safety.md`
- Modify: `src/domain/ai/deepseek-provider.ts`
- Create: `src/domain/ai/deepseek-safety.ts`
- Create: `src/domain/ai/deepseek-safety.test.ts`
- Modify: `src/domain/ai/deepseek-provider.test.ts`
- Modify: `src/domain/ai/api.test.ts`

- [ ] **Step 1: Write failing safety tests**

Create `src/domain/ai/deepseek-safety.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { validateDeepSeekDraft } from "./deepseek-safety"

describe("DeepSeek draft safety", () => {
  it("rejects direct device control instructions", () => {
    const result = validateDeepSeekDraft("立即打开水泵并修改控制阈值。")

    expect(result).toMatchObject({
      ok: false,
      errors: [{ code: "AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN" }],
    })
  })

  it("accepts concise review-only suggestions", () => {
    const result = validateDeepSeekDraft("建议复核设备采样时间、阈值规则和现场供电状态。")

    expect(result).toEqual({
      ok: true,
      value: "建议复核设备采样时间、阈值规则和现场供电状态。",
    })
  })
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm exec vitest run src/domain/ai/deepseek-safety.test.ts
```

Expected: FAIL because `deepseek-safety.ts` does not exist.

- [ ] **Step 3: Implement safety validator**

Create `src/domain/ai/deepseek-safety.ts`:

- reject output containing direct control verbs: `打开水泵`, `关闭水泵`, `下发控制`, `修改阈值`, `自动执行`
- trim whitespace
- cap output at 160 Chinese characters or 240 bytes
- return structured 400-style errors

- [ ] **Step 4: Wire validator into provider**

Modify `src/domain/ai/deepseek-provider.ts` so `choices[0].message.content` passes `validateDeepSeekDraft()` before the provider returns success.

- [ ] **Step 5: Verify Task 2**

Run:

```bash
pnpm exec vitest run src/domain/ai/deepseek-provider.test.ts src/domain/ai/deepseek-safety.test.ts src/domain/ai/api.test.ts
pnpm test
pnpm run build
```

Expected: all pass.

Commit:

```bash
git add docs/specs/S2-13-deepseek-output-safety.md src/domain/ai/deepseek-provider.ts src/domain/ai/deepseek-provider.test.ts src/domain/ai/deepseek-safety.ts src/domain/ai/deepseek-safety.test.ts src/domain/ai/api.test.ts
git commit -m "feat: add DeepSeek output safety checks"
```

---

### Task 3: S3-09 Console Review UX Hardening

**Files:**
- Modify: `src/routes/console.tsx`
- Modify: `src/domain/console/workbench.test.ts`
- Add Playwright coverage if existing e2e structure is active.

- [ ] **Step 1: Write failing UI expectation**

Extend `src/domain/console/workbench.test.ts` to assert:

- `aiAssistant.reviewQueue.items` includes `reviewActions`
- each review item has stable labels for `confirm` and `reject`
- empty state text exists

- [ ] **Step 2: Replace page reload with local state**

Modify `AiAssistantPanel` in `src/routes/console.tsx`:

- keep `reviewQueueItems` in `useState`
- remove confirmed/rejected item from local queue after 200 response
- show button disabled state while request is in flight
- show error text when API returns non-200
- keep mobile layout without horizontal overflow

- [ ] **Step 3: Verify Task 3**

Run:

```bash
pnpm exec vitest run src/domain/console/workbench.test.ts
pnpm run build
```

Expected: PASS.

Commit:

```bash
git add src/routes/console.tsx src/domain/console/workbench.test.ts
git commit -m "feat: harden AI review console UX"
```

---

### Task 4: S4-06 AI Usage and Failure Observability

**Files:**
- Create: `docs/specs/S4-06-ai-observability.md`
- Create: `src/domain/ai/observability.ts`
- Create: `src/domain/ai/observability.test.ts`
- Modify: `src/domain/ai/deepseek-provider.ts`
- Modify: `src/domain/console/workbench.ts`
- Modify: `src/routes/console.tsx`

- [ ] **Step 1: Write failing observability tests**

Create tests requiring:

- provider latency is measured in milliseconds
- DeepSeek HTTP status is recorded on failure
- token count from `usage.total_tokens` is captured when present
- console summary exposes total AI interactions, pending review count and latest failure code

- [ ] **Step 2: Implement AI observability model**

Create `src/domain/ai/observability.ts` with pure functions:

- `createAiProviderMetric(input)`
- `summarizeAiProviderMetrics(metrics)`

No secrets or prompt bodies in metrics.

- [ ] **Step 3: Wire metrics into provider result**

Modify `createDeepSeekDraftProvider().generateDraft()` to return:

- `latencyMs`
- `statusCode`
- `totalTokens`
- `failureCode`

Do not expose API key or full request body.

- [ ] **Step 4: Add console summary**

Add an AI operations summary card in `/console`:

- pending review count
- total AI records
- latest provider failure code
- current model name

- [ ] **Step 5: Verify Task 4**

Run:

```bash
pnpm exec vitest run src/domain/ai/observability.test.ts src/domain/ai/deepseek-provider.test.ts src/domain/console/workbench.test.ts
pnpm test
pnpm run build
git diff --check
```

Expected: all pass.

Commit:

```bash
git add docs/specs/S4-06-ai-observability.md src/domain/ai/observability.ts src/domain/ai/observability.test.ts src/domain/ai/deepseek-provider.ts src/domain/console/workbench.ts src/routes/console.tsx
git commit -m "feat: add AI provider observability"
```

---

## Validation Checklist

- [ ] `DEEPSEEK_API_KEY` exists only in Cloudflare Secrets.
- [ ] DeepSeek output cannot create direct device control instruction.
- [ ] AI review queue works after production confirmation.
- [ ] AI provider failures have visible code and trace id.
- [ ] `pnpm test`, `pnpm run build`, `git diff --check` pass before closing each Issue.
- [ ] GitHub Issues and Feishu project record every completed step.
