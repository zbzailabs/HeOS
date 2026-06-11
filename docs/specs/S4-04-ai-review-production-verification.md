# S4-04 AI 建议闭环生产核验

关联 Issue：[#57](https://github.com/zbzailabs/HeOS/issues/57)

## 1. 目标

核验 DeepSeek AI 建议生成、D1 交互写入、人工确认记录和后台待确认入口在生产环境中的闭环状态。

## 2. 安全边界

- DeepSeek API Key 只通过 Cloudflare Workers Secret 配置。
- 仓库只保留变量名，不提交密钥值。
- AI 建议只进入人工确认队列，不直接触发设备控制。
- 高风险场景保留 `human_confirmation_required=1`。

## 3. 生产配置

配置 DeepSeek Secret：

```bash
pnpm exec wrangler secret put DEEPSEEK_API_KEY
```

可选变量：

```bash
pnpm exec wrangler secret put DEEPSEEK_MODEL
pnpm exec wrangler secret put DEEPSEEK_BASE_URL
```

默认值：

```text
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

## 4. D1 Migration

```bash
pnpm exec wrangler d1 migrations list heos --remote
pnpm exec wrangler d1 migrations apply heos --remote
```

通过标准：

- `0008_heos_ai_review_actions.sql` 已执行，或显示已经执行。
- 远端 D1 存在 `heos_ai_review_actions`。

## 5. 本地验证

```bash
pnpm exec vitest run src/domain/ai/deepseek-provider.test.ts src/domain/ai/review.test.ts src/domain/ai/review-api.test.ts src/domain/ai/review-d1-repository.test.ts src/domain/ai/api.test.ts
pnpm exec vitest run src/domain/core/query.test.ts src/domain/core/d1-query.test.ts src/domain/console/workbench.test.ts
pnpm test
pnpm run build
git diff --check
```

## 6. 生产 API 核验

先生成 DeepSeek AI 建议草稿：

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

再确认该建议：

```bash
curl -sS https://app.yunhe.ai/api/core/ai-reviews \
  -H 'content-type: application/json' \
  --data '{
    "tenantId": "tenant-tenglong-school",
    "interactionId": "<interactionId>",
    "action": "confirm",
    "note": "生产核验确认。"
  }'
```

通过标准：

- 草稿响应包含 `traceId`、`interactionId`、`auditLogId`、`draft`。
- 确认响应包含 `traceId`、`reviewActionId`、`statusAfterAction=confirmed`。
- 后台 `/console` 的 AI 区块显示待确认队列；确认后该项从队列移除。

## 7. 阻塞记录

若生产环境未配置 `DEEPSEEK_API_KEY`，草稿接口返回：

```json
{
  "errors": [
    {
      "code": "DEEPSEEK_API_KEY_MISSING"
    }
  ]
}
```

该结果表示安全边界生效，不视为代码失败；配置 Secret 后重新执行生产 API 核验。

## 8. 后续复测记录

2026-06-11 已在生产环境完成 DeepSeek Secret 配置后的真实调用、人工确认、D1 写入和审计记录复测。复测证据见 [S4-05 DeepSeek 生产密钥配置与真实调用复测](./S4-05-deepseek-production-verification.md)。
