# S4-06 AI 用量、失败和延迟观测

关联 Issue：[#61](https://github.com/zbzailabs/HeOS/issues/61)

## 1. 目标

为 DeepSeek provider 增加基础观测字段，支撑后台快速判断 AI 调用是否成功、延迟是否异常、token 用量是否变化以及最近失败原因。

## 2. 指标模型

`AiProviderMetric` 包含以下字段：

- `provider`：当前为 `deepseek`。
- `modelName`：默认 `deepseek-v4-flash`。
- `status`：`success` 或 `failure`。
- `statusCode`：上游 HTTP 状态码；无上游请求时为 `null`。
- `latencyMs`：请求耗时，取非负整数。
- `totalTokens`：DeepSeek `usage.total_tokens`，取非负整数。
- `failureCode`：失败代码，成功时为 `null`。
- `createdAt`：指标生成时间。

## 3. Provider 行为

DeepSeek provider 在以下路径返回观测字段：

- 成功响应：`providerMetric.status=success`，记录 `statusCode`、`latencyMs`、`totalTokens`。
- 上游非 2xx：`providerMetric.status=failure`，`failureCode=DEEPSEEK_REQUEST_FAILED`。
- 空响应：`failureCode=DEEPSEEK_EMPTY_RESPONSE`。
- 安全校验失败：`failureCode` 使用安全校验错误代码。

## 4. 后台展示

`/console` 的 AI 辅助记录区块展示：

- 当前模型
- AI 记录总数
- 当前待确认数量
- 最近失败代码

该摘要来自 `getConsoleDataWorkbench().aiAssistant.operations`。D1 指标表接入前，最近失败代码保留为 `null`。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/ai/observability.test.ts src/domain/ai/deepseek-provider.test.ts src/domain/console/workbench.test.ts
pnpm run build
```
