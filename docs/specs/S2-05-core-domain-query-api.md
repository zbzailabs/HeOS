# S2-05 PRD 核心域查询 API

## 1. 范围

本规格覆盖 PRD 核心业务域的只读查询接口。接口服务于控制台项目总览、设备列表、告警列表、农事任务、追溯档案和 AI 互动记录。

本阶段使用内存 repository 封装演示数据，接口边界、参数校验、租户过滤、分页结构和 traceId 先稳定下来，后续切换为 D1 repository。

## 2. 接口

所有接口使用 `GET` 方法，成功返回 `{ traceId, data }`，失败返回 `{ traceId, errors }`。

| 路径 | 必填参数 | 可选参数 | 用途 |
| --- | --- | --- | --- |
| `/api/core/dashboard` | `tenantId` | 无 | 返回项目、设备、告警、农事、追溯和 AI 统计 |
| `/api/core/project` | `tenantId`、`projectId` | 无 | 返回项目、基地、地块、大棚、设备和告警聚合详情 |
| `/api/core/devices` | `tenantId` | `limit`、`cursor`、`status`、`siteId` | 返回租户内设备列表 |
| `/api/core/alerts` | `tenantId` | `limit`、`cursor`、`status`、`siteId` | 返回租户内告警列表 |
| `/api/core/agri-tasks` | `tenantId` | `limit`、`cursor`、`status` | 返回租户内农事任务列表 |
| `/api/core/trace-archives` | `tenantId` | `limit`、`cursor` | 返回租户内追溯档案列表 |
| `/api/core/ai-interactions` | `tenantId` | `limit`、`cursor` | 返回租户内 AI 互动记录列表 |

## 3. 校验

- 缺少 `tenantId` 返回 HTTP 400，错误码为 `CORE_MISSING_TENANT`。
- `/api/core/project` 缺少 `projectId` 返回 HTTP 400，错误码为 `CORE_MISSING_PROJECT`。
- `limit` 默认值为 20，最大值为 100；非法值回退默认值。
- `cursor` 使用上一页最后一条记录的 `id`。
- 所有错误返回包含 `traceId`，方便日志排查和前端提示。

## 4. 验收

- `pnpm exec vitest run src/domain/core/query.test.ts src/domain/core/api.test.ts`
- `pnpm test`
- `pnpm build`
- `curl /api/core/devices` 返回 400 和 `CORE_MISSING_TENANT`。
- `curl /api/core/devices?tenantId=tenant-tenglong-school&limit=1` 返回分页数据。
