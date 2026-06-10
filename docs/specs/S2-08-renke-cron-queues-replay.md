# S2-08 Renke Cron Triggers、Queues 与同步重放

## 1. 范围

本规格覆盖 Renke 同步从手动接口推进到生产自动化边界：

- Cloudflare Cron Triggers。
- Cloudflare Queues 失败重试队列。
- Renke 同步队列消息结构。
- Renke 同步重放运维入口。
- 同步失败记录与最近同步状态展示。

## 2. 实现

- `wrangler.jsonc` 配置 `*/15 * * * *` Cron Trigger。
- `wrangler.jsonc` 配置 `RENKE_SYNC_QUEUE` producer 和 `renke-sync-retry` consumer。
- `createRenkeSyncQueueMessage` 固化消息字段：`provider`、`tenantId`、`deviceAddr`、`attempt`、`traceId`。
- `/api/providers/renke/replay` 返回重放计划和队列消息，供运维重放使用。
- `/api/providers/renke/sync` 在可重试失败时尝试发送队列消息；没有队列绑定时返回 `not_configured`，便于诊断。

## 3. 验收

- `pnpm exec vitest run src/domain/renke/sync.test.ts`
- `pnpm exec wrangler queues create renke-sync-retry`
- `pnpm build`
- 部署后 `wrangler.jsonc` 保留 Cron、Queues 和 D1 绑定。

