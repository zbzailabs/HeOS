# S4-03 下一阶段发布验收与线上核验

## 1. 范围

本规格覆盖 #36 至 #41 的阶段发布验收：

- 本地测试与构建。
- Cloudflare D1 migration 和 seed。
- Cloudflare Queue 创建。
- Cloudflare Workers 部署。
- 线上登录入口、D1 数据、核心 API 和 Renke 运维入口核验。
- GitHub Issues 与 GitHub Project 记录同步。

## 2. 验收命令

```bash
pnpm test
pnpm build
pnpm exec wrangler d1 migrations list heos --remote
pnpm run d1:seed:tenglong
pnpm exec wrangler queues create renke-sync-retry
pnpm exec wrangler deployments list --name heos
curl -I https://app.yunhe.ai/login
```

## 3. 发布记录

阶段结束时记录：

- Issue：#36 至 #41。
- 分支和 commit。
- 验证命令与结果。
- D1、Queues、Workers 的线上状态。
- GitHub Issue 记录链接。
- GitHub Project 状态。
