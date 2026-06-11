# S2-11 AI 授权来源建议草稿 API

关联 Issue：[#54](https://github.com/zbzailabs/HeOS/issues/54)

## 1. 目标

在 S2-10 的 AI 交互 D1 写入 API 基础上，建立服务端建议草稿编排能力。后台或后续业务页面提交单个授权业务来源后，服务端生成确定性建议草稿，并写入 `heos_ai_interactions` 与 `heos_audit_logs`。

## 2. 范围

- `/api/core/ai-interactions` POST 支持 `mode: "draft"`。
- 草稿来源使用单个授权业务对象，字段包括 `tenantId`、`table`、`targetId`、`title`、`permissionCode`。
- 支持一期 AI 场景：作物问答、阶段建议、告警解释、农事建议和报告摘要。
- 高风险场景继续要求人工确认：告警解释、农事建议和报告摘要。
- 成功响应返回 `traceId`、`interactionId`、`auditLogId` 和 `draft`。

## 3. 不做范围

- 不接入真实大模型。
- 不保存完整 prompt、完整模型输出、AI Key 或任何生产密钥。
- 不新增 D1 表结构。
- 不修改公开追溯页和生产入口。

## 4. API 边界

请求示例：

```json
{
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
}
```

校验规则：

- 缺失 `HEOS_DB` 返回 503。
- 缺失 `source` 返回 `AI_MISSING_RETRIEVAL_SOURCE`。
- `source.tenantId` 与请求租户不一致返回 `AI_UNAUTHORIZED_RETRIEVAL_SOURCE`。
- 高风险场景未传 `humanConfirmationRequired: true` 返回 `AI_HUMAN_CONFIRMATION_REQUIRED`。

## 5. 验收命令

```bash
pnpm exec vitest run src/domain/ai/draft.test.ts src/domain/ai/api.test.ts src/domain/ai/d1-repository.test.ts
pnpm test
pnpm run build
git diff --check
```
