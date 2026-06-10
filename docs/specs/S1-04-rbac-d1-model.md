# S1-04 权限与菜单 D1 模型规格

版本日期：2026-06-10

## 1. 目标

建立 HeOS 一期权限与菜单的 D1 数据模型，承接 `S0-03` 中的权限管理与后台管理壳层规格，为后续服务端权限校验、服务端菜单过滤和 `/console` 后台壳层提供数据底座。

## 2. 范围

本任务覆盖：

- D1 兼容 SQL 迁移。
- TypeScript 单源定义。
- 权限码、数据范围、后台菜单和表名。
- 表结构与权限定义测试。

本任务不覆盖：

- 创建真实 Cloudflare D1 数据库。
- 配置生产 `wrangler.jsonc` D1 绑定。
- 修改现有登录流。
- 实现 `/console` 页面。
- 实现服务端权限校验函数。

## 3. 数据模型

一期模型包含：

|实体|D1 表|说明|
|---|---|---|
|`Tenant`|`heos_tenants`|租户。|
|`OrgUnit`|`heos_org_units`|组织单元，支持树形结构。|
|`User`|`heos_users`|用户基础身份。|
|`Post`|`heos_posts`|岗位。|
|`Role`|`heos_roles`|角色。|
|`Menu`|`heos_menus`|后台菜单和路由入口。|
|`Permission`|`heos_permissions`|权限点。|
|`RolePermission`|`heos_role_permissions`|角色与权限点绑定。|
|`UserRole`|`heos_user_roles`|用户与角色绑定。|
|`DataScope`|`heos_data_scopes`|数据范围定义。|
|`RoleDataScope`|`heos_role_data_scopes`|角色与数据范围绑定。|
|`AuditLog`|`heos_audit_logs`|权限、登录、导出、查询和高风险动作审计。|

## 4. 权限码

权限码从 `S0-03` 延续，第一批覆盖：

- 租户用户：`tenant:user:read`、`tenant:user:write`
- 租户角色：`tenant:role:read`、`tenant:role:write`
- 项目基地：`project:site:read`、`project:site:write`
- 设备遥测：`device:telemetry:read`
- 设备控制：`device:control:request`
- 告警规则：`alert:rule:write`
- 追溯导出：`trace:archive:export`
- 审计日志：`system:audit:read`
- 系统配置：`system:config:write`

高风险动作必须独立建码，设备控制使用 `device:control:request`，不得与设备读取权限共用。

## 5. 数据范围

数据范围包含：

|代码|说明|
|---|---|
|`all`|全平台。|
|`tenant`|本租户。|
|`org_tree`|本组织及下级。|
|`assigned_projects`|本人项目。|
|`readonly_public`|只读公开。|

业务查询从会话解析 `tenantId`、`userId`、`roleIds` 和 `dataScope`，服务端据此生成查询条件。

## 6. D1 约束

- SQL 使用 SQLite/D1 兼容语法。
- 主键使用 `TEXT`。
- 布尔值使用 `INTEGER`，取值 `0` 或 `1`。
- 时间字段使用 ISO 字符串，默认 `strftime('%Y-%m-%dT%H:%M:%fZ','now')`。
- 复合唯一约束用于防止同一租户内代码重复。
- 高频查询字段建立索引。

## 7. 验收标准

- `docs/specs/S1-04-rbac-d1-model.md` 存在。
- `db/migrations/0001_heos_rbac_core.sql` 存在。
- `src/domain/rbac/access-control.ts` 存在。
- `src/domain/rbac/access-control.test.ts` 覆盖：
  - 权限码唯一性。
  - 数据范围唯一性。
  - 菜单引用的权限码均已定义。
  - D1 迁移包含必要表。
  - D1 迁移包含关键索引。
- `pnpm test` 通过。
- `pnpm build` 通过。

## 8. 相关任务

- GitHub Issue: https://github.com/zbzailabs/HeOS/issues/20
- 上游规格: `docs/specs/S0-03-admin-rbac-console.md`

