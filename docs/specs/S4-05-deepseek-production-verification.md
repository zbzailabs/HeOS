# S4-05 DeepSeek 生产密钥配置与真实调用复测

关联 Issue：[#58](https://github.com/zbzailabs/HeOS/issues/58)

## 1. 目标

在 Cloudflare Workers 生产环境已配置 `DEEPSEEK_API_KEY` 后，复测 DeepSeek draft 生成、人工确认、D1 写入和审计记录链路。

## 2. 安全边界

- `DEEPSEEK_API_KEY` 仅保存在 Cloudflare Workers Secret。
- 仓库只记录变量名、响应编号和核验结论。
- AI 建议只进入人工确认队列，不直接触发设备控制。
- 高风险告警场景保留 `humanConfirmationRequired=true`。

## 3. Secret 核验

核验时间：2026-06-11 19:18:00 Asia/Shanghai。

```bash
pnpm exec wrangler secret list
```

核验结果：生产 Worker Secret 列表包含 `DEEPSEEK_API_KEY`。

## 4. 生产 DeepSeek Draft 复测

请求端点：

```text
POST https://app.yunhe.ai/api/core/ai-interactions
```

请求场景：

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

响应证据：

```text
traceId: ai_mq9em81e_kkud9gw5
interactionId: ai-interaction|ai_mq9em81e_kkud9gw5|alert_explanation|2026-06-11T11%3A18%3A17.906Z
modelName: deepseek-v4-flash
draft.recommendation: 请人工复核pH告警区域，检查传感器是否正常，并核查近期施肥及灌溉记录，确认是否存在酸碱失衡。
```

核验结果：响应包含 `traceId`、`interactionId`、`auditLogId`、`draft.recommendation`，未出现 `DEEPSEEK_API_KEY_MISSING`。

## 5. 人工确认复测

请求端点：

```text
POST https://app.yunhe.ai/api/core/ai-reviews
```

确认响应证据：

```text
statusAfterAction: confirmed
reviewActionId: ai-review|ai-review_mq9emg9e_ts6qb530|ai-interaction%7Cai_mq9em81e_kkud9gw5%7Calert_explanation%7C2026-06-11T11%253A18%253A17.906Z|confirm|2026-06-11T11%3A18%3A28.562Z
```

核验结果：人工确认 API 返回 `statusAfterAction=confirmed`，确认记录成功写入。

## 6. D1 写入核验

核验对象：

- `heos_ai_interactions`
- `heos_ai_review_actions`
- `heos_audit_logs`

核验结果：生产 D1 已存在对应 AI 交互记录、人工确认记录和审计记录。

## 7. 遗留风险

- DeepSeek 输出仍需服务端安全校验，防止出现直接设备控制、阈值修改和自动执行类表述。
- 后台待确认入口需要减少整页刷新，并展示处理中和失败状态。
- 当前仅有交互与审计记录，仍需补充 provider 延迟、失败代码和 token 用量观测。
