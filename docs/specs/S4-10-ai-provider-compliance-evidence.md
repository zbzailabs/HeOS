# S4-10 AI provider 观测合规证据

关联 Issue：[#66](https://github.com/zbzailabs/HeOS/issues/66)

## 1. 目标

将 AI provider 观测能力纳入发布稽核清单，使发布冻结报告能直接引用 DeepSeek provider 指标、D1 持久化、后台摘要和 24 小时时间窗口的交付证据。

## 2. 背景

S4-06 至 S4-09 已完成以下能力：

- DeepSeek provider 返回成功、失败、耗时和 token 指标。
- D1 表 `heos_ai_provider_metrics` 持久化 provider 指标。
- `/console` AI 辅助记录区展示 provider 调用摘要。
- provider 摘要限定最近 24 小时窗口并显示更新时间。

发布稽核需要把这些证据固定到 `heosComplianceItems`，避免验收报告仍停留在早期 AI 记录边界。

## 3. 合规检查项

新增检查项 `S4-10`：

- 标题：AI provider 观测证据。
- Issue：`#66`。
- 状态：`covered`。
- 阻断发布：否。
- 证据：
  - `docs/specs/S4-06-ai-observability.md`
  - `docs/specs/S4-07-ai-provider-metrics-d1.md`
  - `docs/specs/S4-08-ai-provider-metrics-console.md`
  - `docs/specs/S4-09-ai-provider-metrics-window.md`
  - `db/migrations/0009_heos_ai_provider_metrics.sql`
  - `src/domain/ai/metrics-d1-repository.ts`
  - `src/lib/console-data.test.ts`

## 4. 不做范围

- 不新增 D1 migration。
- 不修改 DeepSeek provider 调用。
- 不修改 `/console` UI。
- 不提交 AI Key 或生产密钥。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/compliance/checklist.test.ts
pnpm test
pnpm run build
git diff --check
```
