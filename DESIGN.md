# HeOS Design

## 项目定位

HeOS 是基于 TanStack Start 与 Cloudflare Workers 的作物种植综合服务与智能化管理平台。一期当前重点是围绕腾龙小学智慧农场完成真实 Renke 接入、D1 业务数据、后台工作台、告警农事追溯闭环、AI 人工确认和生产健康检查。

## 技术栈

- TanStack Start
- TanStack Router
- React 19
- Vite
- Tailwind CSS
- Cloudflare Workers / Wrangler
- Cloudflare D1
- Cloudflare R2
- Cloudflare KV
- Cloudflare Queues / Cron Triggers
- Vitest
- pnpm

当前仓库仍保留 Prisma 与 Neon serverless Postgres 的初始化示例。HeOS 一期功能采用 TanStack + Cloudflare 生态：应用运行在 Cloudflare Workers，关系型业务数据优先使用 D1，对象资料和导出文件进入 R2，配置和低频缓存进入 KV，供应商同步和异步任务使用 Queues 与 Cron Triggers。外部 PostgreSQL 只作为 D1 无法满足容量、查询或兼容性要求时的例外方案。

## 工程约定

- 使用 pnpm 管理依赖，并提交 `pnpm-lock.yaml`。
- 本地敏感配置保存在 `.env.local`，不得提交到 GitHub。
- 环境变量示例保存在 `.env.example`。
- 新功能开发采用 Spec-Driven Development：先明确规格、验收标准和边界，再编写代码。
- 修改代码前读取 `AGENTS.md` 和 `DESIGN.md`，保持项目约束一致。

## 当前一期能力

- `/console` 是生产后台入口，`/` 重定向到后台。
- Cloudflare D1 承载租户、项目、设备、遥测、告警、农事、追溯、AI 记录和审计数据。
- Renke 设备 `40406816` 已接入 Cron Triggers、Queues、D1 latest/history 和同步记录。
- 生产写入 API 已完成请求级 session、权限码和租户范围校验。
- `/api/operations/health` 提供持续性生产健康检查。
- 追溯导出已完成 JSON 文件生成、R2 上传、D1 对象引用回填、`trace.export` 审计写入和 `/console` 导出入口；PDF、DOCX、XLSX 文件生成进入后续任务。
