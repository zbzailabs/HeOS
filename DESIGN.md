# HeOS Design

## 项目定位

HeOS 是基于 TanStack Start 初始化的 Web 应用项目，当前阶段目标是完成代码仓库初始化、依赖锁定、基础构建验证和后续开发规范固化。

## 技术栈

- TanStack Start
- TanStack Router
- React 19
- Vite
- Tailwind CSS
- Prisma
- Neon serverless Postgres
- Cloudflare Workers / Wrangler
- Vitest
- pnpm

## 工程约定

- 使用 pnpm 管理依赖，并提交 `pnpm-lock.yaml`。
- 本地敏感配置保存在 `.env.local`，不得提交到 GitHub。
- 环境变量示例保存在 `.env.example`。
- 新功能开发采用 Spec-Driven Development：先明确规格、验收标准和边界，再编写代码。
- 修改代码前读取 `AGENTS.md` 和 `DESIGN.md`，保持项目约束一致。

## 初始化范围

本次初始化包含：

- 修正 Git 远端到 `git@github.com:zbzailabs/HeOS.git`。
- 补齐 `AGENTS.md` 和 `DESIGN.md`。
- 生成 pnpm lockfile。
- 排除本地环境文件。
- 验证安装、测试和构建流程。
