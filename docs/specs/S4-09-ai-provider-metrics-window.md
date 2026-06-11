# S4-09 AI provider 指标 24 小时窗口与更新时间

关联 Issue：[#65](https://github.com/zbzailabs/HeOS/issues/65)

## 1. 目标

在 S4-08 后台历史摘要基础上，限定 AI provider 指标统计窗口为最近 24 小时，并展示统计更新时间，避免过旧调用影响当前生产状态判断。

## 2. 数据来源

后台从 D1 表 `heos_ai_provider_metrics` 读取当前租户最近 24 小时指标：

- `tenant_id = tenant-tenglong-school`。
- `created_at >= windowStart`。
- 按 `created_at DESC` 排序。
- 最多读取 50 条。

`windowStart` 由服务端当前时间减去 24 小时生成。

## 3. 后台摘要字段

`aiAssistant.operations` 增加以下字段：

- `metricsWindowHours`：统计窗口小时数，默认 `24`。
- `metricsUpdatedAt`：窗口内最新一条 provider metric 的 `created_at`；无记录时为 `null`。

现有字段保持含义：

- `recentProviderCalls`：窗口内指标记录数。
- `recentProviderFailures`：窗口内失败指标记录数。
- `averageLatencyMs`：窗口内平均耗时。
- `totalTokens`：窗口内 token 总量。
- `latestFailureCode`：窗口内最近失败代码。

## 4. 降级行为

未配置 D1、指标查询失败、表尚未迁移或窗口内无记录时，后台保留稳定摘要：

- `recentProviderCalls = 0`。
- `recentProviderFailures = 0`。
- `averageLatencyMs = null`。
- `totalTokens = 0`。
- `latestFailureCode = null`。
- `metricsWindowHours = 24`。
- `metricsUpdatedAt = null`。

## 5. 不做范围

- 不新增前端图表。
- 不接入新的 AI provider。
- 不提交 DeepSeek API Key 或生产密钥。
- 不改变 AI 交互、人工确认和审计状态机。

## 6. 验证命令

```bash
pnpm exec vitest run src/lib/console-data.test.ts src/lib/console-data-merge.test.ts src/domain/console/workbench.test.ts
pnpm test
pnpm run build
git diff --check
```
