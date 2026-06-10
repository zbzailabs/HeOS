# S2-04 服务端权限校验与菜单查询函数规格

版本日期：2026-06-10

## 1. 目标

建立 HeOS 一期服务端访问上下文、权限校验和菜单查询函数。该任务承接 `S1-04` 权限与菜单 D1 模型，为后续 `/console` 后台壳层、服务端数据查询和权限路由提供统一入口。

## 2. 范围

本任务覆盖：

- 访问上下文模型：`user`、`tenantId`、`roleIds`、`permissionCodes`、`dataScope`。
- 权限判断函数：单权限、任一权限、全部权限。
- 菜单过滤函数：服务端根据权限返回可见菜单。
- TanStack Server Functions：
  - `getCurrentAccessContext`
  - `getCurrentConsoleMenu`
  - `checkCurrentPermission`
- 测试覆盖未登录、管理员、只读上下文、菜单过滤和高风险权限拒绝。

本任务不覆盖：

- 创建真实 Cloudflare D1 数据库。
- 接入 D1 查询。
- 写入 `wrangler.jsonc` 生产绑定。
- 实现 `/console` 页面。
- 修改现有登录表单。
- 替换后续 OIDC 方案。

## 3. 临时实现边界

当前 HeOS 仍使用单管理员应用会话。S2-04 将已登录管理员映射为启动期平台管理员：

- `tenantId`: `platform`
- `roleIds`: `platform-admin`
- `dataScope`: `all`
- `permissionCodes`: 当前 `S1-04` 定义的全部权限码

后续接入 D1 后，访问上下文由 `heos_users`、`heos_user_roles`、`heos_role_permissions` 和 `heos_role_data_scopes` 查询生成。

## 4. 验收标准

- 未登录用户返回空访问上下文和空菜单。
- 当前管理员会话具备 `all` 数据范围和已定义权限。
- 菜单查询只返回用户具备权限的菜单。
- 高风险设备控制权限不能由普通只读上下文通过。
- `src/domain/rbac/access-policy.test.ts` 覆盖核心策略。
- `pnpm test` 通过。
- `pnpm build` 通过。

## 5. 相关任务

- GitHub Issue: https://github.com/zbzailabs/HeOS/issues/22
- 上游规格: `docs/specs/S1-04-rbac-d1-model.md`

