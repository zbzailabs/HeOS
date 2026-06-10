# S0-04 下一阶段规格与生产验收基线

## 1. 背景

HeOS 已完成标准字典、遥测模型、告警规则、审计字段、权限与菜单模型、`/console` 后台壳层、PRD 核心业务域、Renke D1 同步写入等一期基础能力。下一阶段目标从“模型和页面具备”推进到“生产数据可查、同步任务可运行、业务流程可验收”。

本阶段继续采用 Spec-Driven Development。每个实现任务先补齐规格、验收标准和边界，再编写代码、测试和部署记录。

## 2. 任务范围

|任务|Issue|目标|优先级|验收重点|
|---|---|---|---|---|
|规格与生产验收基线|#36|固化下一阶段任务、验收命令和线上核验清单|P0|规格、合规报告、构建无废弃 API 警告|
|生产 D1 种子数据|#37|建立腾龙小学智慧农场基础租户、项目、站点、设备、作物和任务数据|P0|seed 幂等、生产 D1 可查询|
|核心查询切换 D1|#38|核心查询 API 优先读取 `HEOS_DB`|P0|租户隔离、分页筛选、traceId|
|Renke 自动同步|#39|接入 Cron Triggers、Queues 和同步重放边界|P0|队列消息、失败处理、最近同步状态|
|业务流程页面|#40|告警、农事、追溯和 AI 页面进入可操作流程|P1|权限校验、审计记录、移动端无溢出|
|发布验收|#41|形成下一阶段线上核验和项目记录|P1|部署记录、合规报告、GitHub/飞书一致|

## 3. 生产验收边界

- 应用继续运行在 TanStack Start + Cloudflare Workers。
- 业务数据优先进入 Cloudflare D1，生产路由优先读取 `HEOS_DB`。
- Renke 供应商凭据只通过 Workers Secrets 或部署平台密钥读取，前端不暴露账号、密码和 token。
- Cron Triggers 负责定时触发 Renke 同步，Queues 负责失败重试和后续异步扩展。
- 控制命令继续默认关闭，本阶段不开放真实设备控制。
- 公开追溯只展示明确允许公开的数据。

## 4. 验收命令

每个 Issue 完成时运行：

```bash
pnpm test
pnpm build
```

涉及文档变更时运行：

```bash
rg -n "^##\\s*$|^#\\s*$" docs
rg -n "Next\\.js|NestJS|Supabase|Drizzle|TimescaleDB|Dokploy monorepo" docs
```

涉及 Cloudflare D1 时补充：

```bash
pnpm exec wrangler d1 migrations list heos
pnpm exec wrangler d1 execute heos --remote --command "SELECT COUNT(*) AS count FROM heos_projects;"
```

涉及线上发布时补充：

```bash
pnpm exec wrangler deployments list --name heos
curl -I https://app.yunhe.ai/login
```

## 5. 风险与处理

- D1 seed 重复执行风险：所有 seed 记录使用稳定主键和 `ON CONFLICT` 更新。
- 线上查询与本地测试差异：保留内存 repository 测试，同时增加 D1 repository 边界测试。
- Renke 源站不稳定：同步失败写入 `heos_sync_runs`，可重试错误进入队列边界。
- 业务流程过早扩张：本阶段只完成告警、农事、追溯和 AI 记录的核心闭环，不接导出和真实 AI 调用。
- 权限误放大：所有写入动作必须经过服务端权限校验，前端显示不作为安全边界。

## 6. 发布记录要求

阶段结束时在 GitHub Issues、GitHub Project 和飞书项目同步以下内容：

- Issue、PR、commit 链接。
- 修改文件清单。
- 验证命令与结果。
- Cloudflare Workers、D1、Cron、Queues 的线上核验结果。
- 未完成项、阻断项和下一轮建议。
