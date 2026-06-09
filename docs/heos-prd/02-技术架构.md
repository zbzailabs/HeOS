# HeOS 技术架构

版本日期：2026-06-08

## 1. 当前仓库技术栈

当前仓库已经配置以下技术：

|层级|当前技术|依据|
|---|---|---|
|应用框架|TanStack Start|`package.json`、`vite.config.ts`|
|路由|TanStack Router|`src/routes`、`src/routeTree.gen.ts`|
|前端|React 19、TypeScript、Vite|`package.json`|
|样式|Tailwind CSS 4、shadcn/ui 依赖、Lucide React|`package.json`、`src/styles.css`|
|数据库示例|Prisma 7、Neon serverless PostgreSQL|`package.json`、`prisma/schema.prisma`、`src/db.ts`|
|部署|Cloudflare Workers / Wrangler|`wrangler.jsonc`、`vite.config.ts`|
|测试|Vitest|`package.json`|
|包管理|pnpm|`pnpm-lock.yaml`|

当前数据库 schema 只有 `Todo` 示例模型，业务实体尚未实现。Prisma/Neon 属于初始化示例，不作为一期业务默认数据底座。本文档描述一期目标架构，不代表代码已经完成。

## 2. 一期目标架构

```text
浏览器 / 大屏
  -> TanStack Start Web
  -> Server Functions / Server Routes
  -> Cloudflare Workers
  -> Cloudflare D1

供应商平台 / 仁科接口
  -> Cron Triggers / Queues / 受控接入函数
  -> 标准化映射
  -> TelemetryLatest / TelemetryHistory / Alert

对象资料 / 报告 / 图片
  -> Cloudflare R2

配置 / 字典 / 功能开关
  -> Cloudflare KV

部署与边缘运行
  -> Cloudflare Workers
```

## 3. 应用层

### 3.1 TanStack Start

TanStack Start 负责页面渲染、服务端函数、服务端路由和 Cloudflare Workers 运行入口。业务页面按 `src/routes` 文件路由组织。

### 3.2 TanStack Router

路由负责页面路径、参数、loader 和导航类型安全。新增业务页面放入 `src/routes`，并保持页面与数据加载逻辑清晰分离。

### 3.3 Server Functions

Server Functions 负责页面内部数据读取和写入，例如项目概览、设备状态、告警列表、作物周期和农事任务。所有敏感读写在服务端函数内完成权限校验。

### 3.4 Server Routes

Server Routes 负责外部接口、供应商 webhook、公开追溯 API 和后续 OpenAPI 输出。供应商接入不暴露给前端直连。

## 4. 数据层

### 4.1 数据库

一期业务主数据优先采用 Cloudflare D1。D1 承载租户、项目、站点、地块、设备、告警、审计、作物模型、农事任务、仁科同步状态和基础遥测索引。应用通过 Cloudflare Workers 绑定访问 D1，避免前端直连数据库。

外部 PostgreSQL、Prisma、Neon 只作为例外方案。出现以下情况时进入技术评审：D1 容量不足、查询模式超出 D1 边界、需要 PostgreSQL 专有能力、历史数据规模明显超过 D1 适用范围、现有迁移资产必须复用。

核心实体命名固定为：

- `Tenant`
- `Project`
- `Site`
- `Plot`
- `Device`
- `TelemetryLatest`
- `TelemetryHistory`
- `Alert`
- `ControlCommand`
- `AuditLog`
- `CropModel`
- `AgriTask`

### 4.2 数据隔离

核心业务表带 `tenantId`。项目、站点、地块、设备、作物周期、遥测、告警、命令和审计记录都保留租户归属。查询层必须传入当前租户上下文。

### 4.3 遥测数据

`TelemetryLatest` 存储设备最新值和在线状态，优先进入 D1。`TelemetryHistory` 存储历史采样值，第一版按设备、指标和时间分区设计 D1 表结构，先满足仁科设备接入、实时展示、历史曲线和告警计算。高频、大体量时序数据超过 D1 适用范围后，再评估外部 PostgreSQL 或专用时序库。

### 4.4 对象资料

图片、报告、追溯素材和导出文件使用 Cloudflare R2。业务表只保存对象 key、元数据、来源和归属关系。

### 4.5 配置与缓存

租户配置、字典、功能开关、低频缓存和公开追溯页缓存优先使用 Cloudflare KV。强一致业务状态进入 D1。

### 4.6 异步任务

仁科数据同步、告警派发、报告生成、AI 摘要和失败重试优先使用 Cloudflare Queues。定时拉取、补偿同步和周期巡检使用 Cron Triggers。需要单设备串行、幂等锁或短期协调时，再评估 Durable Objects。

## 5. 接口边界

### 5.1 内部页面数据

页面通过 Server Functions 获取数据。示例接口形态：

```ts
import { createServerFn } from '@tanstack/react-start'

export const getProjectDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    return {
      projectName: '腾龙小学智慧农场',
      onlineDevices: 8,
      totalDevices: 10,
      activeAlerts: 3,
    }
  },
)
```

### 5.2 外部接入

供应商接入通过 Cron Triggers、Queues、Server Routes 或受控后台动作完成。供应商 token、账号、密码和同步状态不进入浏览器。

### 5.3 控制命令

控制命令必须经过以下链路：

1. 租户和角色权限校验。
2. 设备能力校验。
3. 作物阶段和策略范围校验。
4. 安全阈值校验。
5. 二次确认或审批。
6. 命令有效期校验。
7. 供应商或边缘侧下发。
8. 回执、失败告警和 `AuditLog` 记录。

### 5.4 AI 调用

AI 调用通过服务端代理执行。Tool Registry 只开放授权数据读取工具，不开放直接控制设备工具。AI 输出写入审计记录，展示来源引用。

## 6. 部署架构

当前部署目标为 Cloudflare Workers。D1、R2、KV、Queues、Cron Triggers 和 Secrets 通过 Wrangler 配置与环境绑定。部署流程：

```bash
pnpm install
pnpm run test
pnpm run build
pnpm run deploy
```

生产环境密钥通过 Wrangler Secrets 或部署平台配置。`.env.local` 仅用于本地开发。

## 7. 后续评估项

以下技术不属于当前一期主栈，只保留后续评估入口：

|技术|评估场景|
|---|---|
|Next.js|独立官网、文档站或特殊生态需求|
|NestJS|独立后端服务拆分到单独仓库|
|Taro|小程序离线和移动端深度适配|
|Supabase|托管 Auth、Realtime、Storage 一体化替换方案|
|Drizzle|强类型 SQL 建模替换 Prisma 的方案|
|Prisma / Neon PostgreSQL|D1 无法满足容量、复杂查询或 PostgreSQL 兼容要求时再评估|
|TimescaleDB|高频时序数据规模超过 D1 和普通 PostgreSQL 表设计后再评估|
|Dokploy monorepo|自托管多服务部署阶段再评估|
