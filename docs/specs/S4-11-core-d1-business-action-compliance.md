# S4-11 核心域 D1 与业务动作合规证据

关联 Issue：[#67](https://github.com/zbzailabs/HeOS/issues/67)

## 1. 目标

将核心域 D1 查询、控制台 D1 数据合并、告警状态流转、农事执行记录、追溯归档和审计写入纳入发布稽核清单，使发布冻结报告引用当前已完成的生产链路证据。

## 2. 背景

一期验收要求项目、设备、告警、农事、追溯和 AI 辅助具备真实数据链路与审计记录。#37、#38、#40 已补齐生产 D1 seed、核心查询 D1 repository、控制台 D1 覆盖路径、告警状态动作、农事任务执行记录和追溯归档。发布稽核清单需要同步这些证据，避免仍把已完成能力写成后续计划。

## 3. 合规检查项

新增检查项 `S4-11`：

- 标题：核心域 D1 与业务动作证据。
- Issue：`#67`。
- 状态：`covered`。
- 阻断发布：否。
- 证据：
  - `docs/specs/S2-07-core-d1-query-api.md`
  - `docs/specs/S3-06-console-business-workflows.md`
  - `src/domain/core/d1-query.ts`
  - `src/lib/console-data.ts`
  - `src/domain/production/actions.ts`
  - `src/routes/api/core/alerts.ts`
  - `src/routes/api/core/agri-tasks.ts`
  - `src/domain/production/actions.test.ts`

## 4. 清单更新

- `S2-05` 的计划从后续切换 D1 改为继续运行核验 D1 查询证据。
- `S3-01` 的计划从后续接入真实审计改为继续运行核验告警状态流转和审计写入。
- `S3-05` 的计划增加业务动作 API、农事记录和追溯归档证据。

## 5. 不做范围

- 不新增 D1 migration。
- 不修改生产 API 行为。
- 不修改 Cloudflare secret 或部署配置。
- 不新增前端页面。

## 6. 验证命令

```bash
pnpm exec vitest run src/domain/compliance/checklist.test.ts
pnpm test
pnpm run build
git diff --check
```
