# S4-07 AI provider 指标 D1 持久化

关联 Issue：[#63](https://github.com/zbzailabs/HeOS/issues/63)

## 1. 目标

将 DeepSeek provider 返回的调用指标写入 D1，形成 AI 调用成功、失败、耗时和 token 用量的历史记录，支撑生产排障和后续后台观测。

## 2. 数据表

新增 `heos_ai_provider_metrics`：

- `id`：稳定主键，包含 trace、provider 和创建时间。
- `trace_id`：请求追踪 ID。
- `tenant_id`：租户 ID。
- `user_id`：触发用户 ID，可为空。
- `interaction_id`：成功写入 AI interaction 时关联对应记录，失败时为空。
- `provider`：当前为 `deepseek`。
- `model_name`：实际调用模型。
- `status`：`success` 或 `failure`。
- `status_code`：上游 HTTP 状态码。
- `latency_ms`：调用耗时，非负整数。
- `total_tokens`：上游返回 token 总量，非负整数。
- `failure_code`：失败代码，成功时为空。
- `created_at`：指标生成时间。

## 3. API 行为

`/api/core/ai-interactions` 的 `mode=draft` 分支写入 provider metric：

- DeepSeek 成功后，先写入 `heos_ai_interactions` 和 `heos_audit_logs`，再写入 `heos_ai_provider_metrics`，`interaction_id` 关联本次交互。
- DeepSeek 返回受控失败且带 provider metric 时，写入 `heos_ai_provider_metrics` 后返回原结构化错误，`interaction_id` 为空。
- 缺少 `DEEPSEEK_API_KEY` 属于配置错误，provider 不产生调用指标。

## 4. 不做范围

- 不新增前端图表。
- 不提交 DeepSeek API Key 或生产密钥。
- 不改变人工确认状态机。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/ai/metrics-d1-repository.test.ts src/domain/ai/api.test.ts
pnpm test
pnpm run build
git diff --check
```
