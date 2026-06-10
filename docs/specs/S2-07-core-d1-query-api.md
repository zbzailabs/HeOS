# S2-07 核心查询接口切换 D1 repository

## 1. 范围

本规格覆盖 `/api/core/*` 核心查询接口的 D1 读取实现：

- `/api/core/dashboard`
- `/api/core/project`
- `/api/core/devices`
- `/api/core/alerts`
- `/api/core/agri-tasks`
- `/api/core/trace-archives`
- `/api/core/ai-interactions`

## 2. 实现

- `src/domain/core/d1-query.ts` 提供 D1 repository。
- `src/domain/core/api.ts` 提供 `createD1CoreApiHandlers`。
- `src/lib/core-api.ts` 在 `HEOS_DB` 存在时使用 D1 handler，没有绑定时保留内存 handler。
- 所有 SQL 查询包含 `tenant_id = ?` 过滤。
- 公开追溯查询只返回 `visibility = public` 的记录。

## 3. 验收

- `pnpm exec vitest run src/domain/core/d1-query.test.ts`
- `pnpm exec vitest run src/domain/core/query.test.ts`
- `pnpm build`
- API 响应保留 `traceId`、分页、筛选和租户隔离。

