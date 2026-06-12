# S4-16 TanStack AI Runtime 适配与流式控制台

关联 Issue：[#72](https://github.com/zbzailabs/HeOS/issues/72)

## 1. 目标

在既有 DeepSeek 建议草稿、人工确认和 AI provider 观测能力基础上，引入 TanStack AI 运行时边界，使 HeOS 后台具备可自托管、可观测、可切换 provider 的 AI runtime 验证入口。

## 2. 范围

- 使用 TanStack AI typed tool 定义 HeOS AI 草稿工具。
- 新增 AG-UI-compatible request envelope 解析能力。
- 新增 `/api/core/ai-runtime`，以 `text/event-stream` 返回运行事件。
- 支持 OpenRouter 与 OpenAI provider 元数据切换。
- 运行事件覆盖 `RUN_STARTED`、`TOOL_CALL_APPROVAL_REQUIRED`、`TOOL_CALL_APPROVED`、`TEXT_MESSAGE_CONTENT`、`STRUCTURED_OUTPUT` 和 `RUN_FINISHED`。
- `/console` AI 辅助记录区展示 TanStack AI Runtime 控制区，包含 provider、审批状态、事件流、结构化草稿和媒体能力状态。

## 3. 不做范围

- 不通过 hosted gateway 转发请求。
- 不提交 OpenAI、OpenRouter 或 DeepSeek API Key。
- 不允许 AI runtime 直接触发设备控制、阈值修改或自动执行业务动作。
- 不新增 D1 表结构。
- 不替换既有 `/api/core/ai-interactions` 与 `/api/core/ai-reviews` 闭环。

## 4. API 行为

`/api/core/ai-runtime` 接收 AG-UI-compatible POST 请求，核心输入来自 `forwardedProps`：

```json
{
  "threadId": "thread-console-ai",
  "runId": "run-console-ai-001",
  "messages": [
    {
      "id": "message-console-ai",
      "role": "user",
      "content": "基于授权来源生成人工复核建议。"
    }
  ],
  "forwardedProps": {
    "tenantId": "tenant-tenglong-school",
    "userId": "user-tenglong-admin",
    "scenario": "alert_explanation",
    "provider": "openrouter",
    "source": {
      "tenantId": "tenant-tenglong-school",
      "table": "heos_alerts",
      "targetId": "alert-soil-ph-critical",
      "title": "soil_ph critical 告警",
      "permissionCode": "alert:read"
    },
    "approveToolCall": false
  }
}
```

响应要求：

- 成功返回 HTTP 200。
- `content-type` 为 `text/event-stream; charset=utf-8`。
- 响应头包含 `x-heos-ai-runtime: tanstack-ai` 和 `x-trace-id`。
- 缺失 `scenario` 或 `source` 返回 400，错误码为 `AI_RUNTIME_INVALID_REQUEST`。

## 5. 验收命令

```bash
pnpm exec vitest run src/domain/ai/tanstack-runtime.test.ts src/domain/ai/api.test.ts
pnpm test
pnpm run build
git diff --check
```
