# HeOS AI Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 S2-11 AI 授权来源建议草稿推进为 DeepSeek 生成、人工确认、拒绝和业务处理记录闭环。

**Architecture:** 继续使用 TanStack Start + Cloudflare Workers + D1。DeepSeek API 作为大模型底座，仅在服务端调用，密钥通过 Workers Secret `DEEPSEEK_API_KEY` 注入；新增 AI review 领域模型和 D1 写入边界，保留 `/api/core/ai-interactions` 作为交互记录入口，新增 `/api/core/ai-reviews` 处理人工确认动作，后台工作台展示待确认 AI 建议。

**Tech Stack:** TypeScript, TanStack Start, Cloudflare Workers, Cloudflare D1, DeepSeek Chat Completions API, Vitest, pnpm.

---

## Current Baseline

- #49 已完成一期生产端到端验收。
- #52 已完成 AI 授权来源与审计写入计划。
- #53 已完成 AI 交互 D1 写入 API。
- #54 已完成 S2-11 AI 授权来源建议草稿 API。
- 飞书项目 `7015640531` 当前处于“技术方案中”。

## Next Development Track

本计划建议拆成 3 个 GitHub Issues：

1. `[heos-prod] S2-12 DeepSeek AI 建议与人工确认 API`
2. `[heos-prod] S3-08 后台 AI 待确认入口`
3. `[heos-prod] S4-04 AI 建议闭环生产核验`

---

### Task 1: S2-12 Spec, Review Model, and D1 Migration

**Files:**
- Create: `docs/specs/S2-12-ai-review-workflow.md`
- Create: `src/domain/ai/deepseek-provider.ts`
- Create: `src/domain/ai/deepseek-provider.test.ts`
- Create: `src/domain/ai/review.ts`
- Create: `src/domain/ai/review.test.ts`
- Create: `db/migrations/0008_heos_ai_review_actions.sql`

- [ ] **Step 1: Write failing DeepSeek provider and state-machine tests**

Add `src/domain/ai/review.test.ts` with tests for pending, confirmed, rejected and action payload validation:

```ts
import { describe, expect, it } from "vitest"

import {
  aiReviewActions,
  aiReviewStatuses,
  createAiReviewActionPlan,
} from "./review"

describe("AI review workflow", () => {
  it("creates a confirmed review action for a high-risk AI interaction", () => {
    const result = createAiReviewActionPlan({
      traceId: "trace-ai-review-001",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: "ai-interaction-001",
      action: aiReviewActions.CONFIRM,
      note: "已核对告警和设备状态，同意进入处理。",
      createdAt: "2026-06-11T14:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      value: {
        reviewAction: {
          record: {
            tenantId: "tenant-tenglong-school",
            interactionId: "ai-interaction-001",
            action: aiReviewActions.CONFIRM,
            statusAfterAction: aiReviewStatuses.CONFIRMED,
          },
        },
      },
    })
  })

  it("rejects empty reviewer notes", () => {
    const result = createAiReviewActionPlan({
      traceId: "trace-ai-review-002",
      tenantId: "tenant-tenglong-school",
      userId: "user-tenglong-admin",
      interactionId: "ai-interaction-001",
      action: aiReviewActions.REJECT,
      note: "",
      createdAt: "2026-06-11T14:00:00.000Z",
    })

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: [{ code: "AI_REVIEW_NOTE_REQUIRED" }],
    })
  })
})
```

Add `src/domain/ai/deepseek-provider.test.ts` with tests for OpenAI-compatible request shape:

```ts
import { describe, expect, it } from "vitest"

import { createDeepSeekDraftProvider } from "./deepseek-provider"

describe("DeepSeek draft provider", () => {
  it("calls DeepSeek chat completions with server-only bearer auth", async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const provider = createDeepSeekDraftProvider({
      apiKey: "deepseek-test-key",
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "请复核设备状态。" } }],
            usage: { total_tokens: 12 },
          }),
          { status: 200 },
        )
      },
    })

    const result = await provider.generateDraft({
      scenario: "alert_explanation",
      sourceTitle: "soil_ph critical 告警",
      sourceSummary: "pH=9",
    })

    expect(result).toEqual({
      ok: true,
      value: {
        modelName: "deepseek-v4-flash",
        outputSummary: "请复核设备状态。",
        costCents: 0,
      },
    })
    expect(calls[0]?.url).toBe("https://api.deepseek.com/chat/completions")
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer deepseek-test-key",
      "content-type": "application/json",
    })
  })
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm exec vitest run src/domain/ai/review.test.ts
```

Expected: FAIL because `src/domain/ai/review.ts` and `src/domain/ai/deepseek-provider.ts` do not exist.

- [ ] **Step 3: Implement minimal review model**

Create `src/domain/ai/deepseek-provider.ts` with:

- default base URL `https://api.deepseek.com`
- default model `deepseek-v4-flash`
- endpoint `/chat/completions`
- `Authorization: Bearer ${DEEPSEEK_API_KEY}`
- no API key accepted from browser request body
- return `DEEPSEEK_API_KEY_MISSING` before fetch when key is absent

Use non-stream JSON response and extract `choices[0].message.content`.

- [ ] **Step 4: Implement minimal review model**

Create `src/domain/ai/review.ts` with:

```ts
export const aiReviewActions = {
  CONFIRM: "confirm",
  REJECT: "reject",
} as const

export const aiReviewStatuses = {
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
} as const

export const aiReviewErrorCodes = {
  NOTE_REQUIRED: "AI_REVIEW_NOTE_REQUIRED",
  INTERACTION_REQUIRED: "AI_REVIEW_INTERACTION_REQUIRED",
} as const
```

Implement `createAiReviewActionPlan(input)` with stable record id:

```ts
`ai-review|${traceId}|${interactionId}|${action}|${createdAt}`
```

Validate:

- `interactionId` is non-empty.
- `note.trim()` is non-empty.
- `action` is `confirm` or `reject`.
- `confirm` maps to `confirmed`; `reject` maps to `rejected`.

- [ ] **Step 5: Add D1 migration**

Create `db/migrations/0008_heos_ai_review_actions.sql`:

```sql
CREATE TABLE IF NOT EXISTS heos_ai_review_actions (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  interaction_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('confirm', 'reject')),
  status_after_action TEXT NOT NULL CHECK (
    status_after_action IN ('confirmed', 'rejected')
  ),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES heos_tenants(id),
  FOREIGN KEY (interaction_id) REFERENCES heos_ai_interactions(id)
);

CREATE INDEX IF NOT EXISTS idx_heos_ai_review_actions_tenant_interaction
  ON heos_ai_review_actions (tenant_id, interaction_id, created_at);
```

- [ ] **Step 6: Verify Task 1**

Run:

```bash
pnpm exec vitest run src/domain/ai/deepseek-provider.test.ts src/domain/ai/review.test.ts
```

Expected: PASS.

Commit:

```bash
git add docs/specs/S2-12-ai-review-workflow.md src/domain/ai/deepseek-provider.ts src/domain/ai/deepseek-provider.test.ts src/domain/ai/review.ts src/domain/ai/review.test.ts db/migrations/0008_heos_ai_review_actions.sql
git commit -m "feat: add DeepSeek AI review workflow model"
```

---

### Task 2: S2-12 Review API and Repository

**Files:**
- Modify: `src/domain/ai/api.ts`
- Create: `src/domain/ai/review-api.ts`
- Create: `src/domain/ai/review-api.test.ts`
- Create: `src/domain/ai/review-d1-repository.ts`
- Create: `src/domain/ai/review-d1-repository.test.ts`
- Create: `src/routes/api/core/ai-reviews.ts`

- [ ] **Step 1: Write failing API tests**

Create `src/domain/ai/review-api.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { handleAiReviewPost } from "./review-api"

describe("AI review POST API", () => {
  it("returns 503 when HEOS_DB is missing", async () => {
    const result = await handleAiReviewPost({
      body: {
        tenantId: "tenant-tenglong-school",
        interactionId: "ai-interaction-001",
        action: "confirm",
        note: "已人工确认。",
      },
      traceId: "trace-ai-review-api-001",
      now: "2026-06-11T14:30:00.000Z",
    })

    expect(result).toMatchObject({
      status: 503,
      body: {
        errors: [{ code: "HEOS_DB_NOT_CONFIGURED" }],
      },
    })
  })
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm exec vitest run src/domain/ai/review-api.test.ts
```

Expected: FAIL because `review-api.ts` does not exist.

- [ ] **Step 3: Implement D1 repository**

Create `src/domain/ai/review-d1-repository.ts` with `createD1AiReviewRepository(db).createReviewAction(input)`.

SQL insert:

```sql
INSERT INTO heos_ai_review_actions (
  id,
  trace_id,
  tenant_id,
  user_id,
  interaction_id,
  action,
  status_after_action,
  note,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

- [ ] **Step 4: Implement pure API handler**

Create `src/domain/ai/review-api.ts`:

- Parse JSON object body.
- Default tenant to `tenant-tenglong-school`.
- Default user to `user-tenglong-admin`.
- For `mode: "draft"`, use DeepSeek when `DEEPSEEK_API_KEY` is configured; otherwise return `503 DEEPSEEK_API_KEY_MISSING`.
- Return 503 when `db` is absent.
- Return 400 for model validation errors.
- Return 200 with `traceId`, `reviewActionId`, `statusAfterAction`.

- [ ] **Step 5: Add TanStack route**

Create `src/routes/api/core/ai-reviews.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { handleAiReviewPost } from "../../../domain/ai/review-api"
import type { AiReviewD1Database } from "../../../domain/ai/review-d1-repository"
import { createTraceId } from "../../../domain/telemetry/api"

export const Route = createFileRoute("/api/core/ai-reviews")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const traceId = createTraceId("ai-review")
        const result = await handleAiReviewPost({
          body: await request.json(),
          db: (env as { HEOS_DB?: AiReviewD1Database }).HEOS_DB,
          traceId,
          now: new Date().toISOString(),
        })

        return json(result.body, { status: result.status })
      },
    },
  },
})
```

- [ ] **Step 6: Verify Task 2**

Run:

```bash
pnpm exec vitest run src/domain/ai/review.test.ts src/domain/ai/review-api.test.ts src/domain/ai/review-d1-repository.test.ts
pnpm run build
```

Expected: PASS.

Commit:

```bash
git add src/domain/ai/api.ts src/domain/ai/review-api.ts src/domain/ai/review-api.test.ts src/domain/ai/review-d1-repository.ts src/domain/ai/review-d1-repository.test.ts src/routes/api/core/ai-reviews.ts
git commit -m "feat: add DeepSeek AI review API"
```

---

### Task 3: S3-08 Console AI Review Queue

**Files:**
- Modify: `src/domain/core/query.ts`
- Modify: `src/domain/core/d1-query.ts`
- Modify: `src/domain/core/api.ts`
- Modify: `src/domain/console/workbench.ts`
- Modify: `src/lib/console-data.ts`
- Modify: `src/routes/console.tsx`
- Add tests beside changed domain files.

- [ ] **Step 1: Add query tests**

Add tests that require AI interactions with `humanConfirmationRequired = 1` to appear in a pending review list until a `heos_ai_review_actions` row exists for that interaction.

Run:

```bash
pnpm exec vitest run src/domain/core/query.test.ts src/domain/core/d1-query.test.ts
```

Expected: FAIL before implementation.

- [ ] **Step 2: Add read models**

Add `CoreAiReviewQueueItem`:

```ts
export type CoreAiReviewQueueItem = {
  id: string
  tenantId: string
  scenario: string
  modelName: string
  sourceTitle: string
  outputSummary: string
  createdAt: string
}
```

Add `listAiReviewQueue(query)` to seed and D1 repositories.

- [ ] **Step 3: Add console panel**

In `src/routes/console.tsx`, extend `AiAssistantPanel`:

- show a “待人工确认” subsection.
- list scenario, source title, created time and summary.
- render two compact buttons: “确认” and “拒绝”.
- keep current AI record list visible.

- [ ] **Step 4: Add interaction handler**

Add a client-side handler in `AiAssistantPanel`:

```ts
await fetch("/api/core/ai-reviews", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    tenantId: "tenant-tenglong-school",
    interactionId,
    action,
    note,
  }),
})
```

Use fixed note text for the first version:

- confirm: `后台工作台人工确认。`
- reject: `后台工作台人工拒绝。`

- [ ] **Step 5: Verify Task 3**

Run:

```bash
pnpm exec vitest run src/domain/core/query.test.ts src/domain/core/d1-query.test.ts src/domain/console/workbench.test.ts
pnpm test
pnpm run build
```

Expected: PASS.

Commit:

```bash
git add src/domain/core src/domain/console src/lib/console-data.ts src/routes/console.tsx
git commit -m "feat: add console AI review queue"
```

---

### Task 4: S4-04 Production Verification and Tracker Update

**Files:**
- Modify: `docs/specs/S4-03-next-stage-release-verification.md` or create `docs/specs/S4-04-ai-review-production-verification.md`

- [ ] **Step 1: Full local verification**

Run:

```bash
pnpm test
pnpm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: D1 migration verification**

Run:

```bash
pnpm exec wrangler d1 migrations list heos --remote
pnpm exec wrangler d1 migrations apply heos --remote
```

Expected: migration `0008_heos_ai_review_actions.sql` applied or reported as already applied.

- [ ] **Step 3: API verification**

Run a production review action only against a known test interaction created for this task:

```bash
curl -sS https://app.yunhe.ai/api/core/ai-reviews \
  -H 'content-type: application/json' \
  --data '{"tenantId":"tenant-tenglong-school","interactionId":"<test-interaction-id>","action":"confirm","note":"生产核验确认。"}'
```

Expected: response contains `traceId`, `reviewActionId`, `statusAfterAction`.

- [ ] **Step 4: Tracker update**

Record in GitHub Issue and Feishu project:

- Issue links.
- Commit SHAs.
- Verification command outputs.
- D1 migration result.
- Production API response.
- Any remaining manual QA fields that block Feishu node completion.

Commit docs update:

```bash
git add docs/specs/S4-04-ai-review-production-verification.md
git commit -m "docs: add AI review production verification"
```

---

## Validation Checklist

- [ ] DeepSeek model integration runs only on server.
- [ ] No AI Key or production secret added.
- [ ] No direct device control from AI.
- [ ] Every AI review action records tenant, user, trace id, interaction id, action and note.
- [ ] High-risk AI suggestions remain blocked until human confirmation.
- [ ] `pnpm test`, `pnpm run build`, and `git diff --check` pass before each Issue closes.
