# S4-08 AI provider 指标后台历史摘要

关联 Issue：[#64](https://github.com/zbzailabs/HeOS/issues/64)

## 1. 目标

在后台 AI 辅助记录区展示 DeepSeek provider 指标历史摘要，使生产排障能直接查看最近调用、失败数、平均耗时、token 用量和最近失败代码。

## 2. 数据来源

后台从 D1 表 `heos_ai_provider_metrics` 读取当前租户最近 50 条 provider 指标：

- 按 `created_at DESC` 排序。
- 仅查询 `tenant_id = tenant-tenglong-school` 的记录。
- 成功和失败记录都进入统计。
- 最近失败代码取最近一条失败记录的 `failure_code`。

## 3. 后台摘要字段

`aiAssistant.operations` 增加以下字段：

- `recentProviderCalls`：最近指标记录数。
- `recentProviderFailures`：最近失败指标记录数。
- `averageLatencyMs`：最近指标平均耗时，四舍五入到整数毫秒。
- `totalTokens`：最近指标 token 总量。

## 4. 降级行为

未配置 D1、指标查询失败或表尚未迁移时，后台保留静态摘要，不影响 `/console` 打开。

## 5. 不做范围

- 不新增前端图表。
- 不接入新的 AI provider。
- 不提交 DeepSeek API Key 或生产密钥。
- 不改变人工确认状态机。

## 6. 验证命令

```bash
pnpm exec vitest run src/lib/console-data.test.ts src/lib/console-data-merge.test.ts src/domain/console/workbench.test.ts
pnpm test
pnpm run build
git diff --check
```
