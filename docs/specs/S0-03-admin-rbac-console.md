# S0-03 权限管理与后台管理壳层规格

版本日期：2026-06-10

## 1. 目标

建立 HeOS 一期权限管理与后台管理壳层的规格边界。该规格承接 PRD 中的租户权限、组织、用户、角色、数据范围、审计和统一工作台要求，为后续数据库模型、Server Functions、页面路由和审计记录提供单一依据。

## 2. 参考边界

### 2.1 RuoYi 参考内容

参考仓库：<https://github.com/yangzongzhuan/RuoYi>

RuoYi 当前 README 显示其定位为基于 Spring Boot 的权限管理系统，内置用户管理、部门管理、岗位管理、菜单管理、角色管理、字典管理、参数管理、操作日志、登录日志、在线用户、定时任务、系统接口和服务监控等能力。

HeOS 借鉴以下模型：

- 用户、组织、岗位、角色、菜单、按钮权限。
- 角色绑定菜单权限与数据范围。
- 字典、参数、操作日志、登录日志。
- 后台管理模块按系统能力分组。

HeOS 不采用以下内容：

- Java、Spring Boot、MyBatis、Shiro 技术栈。
- RuoYi 前端模板、后端代码生成器和数据库脚本。
- 通用后台的全部功能菜单。

### 2.2 soybean-admin 参考内容

参考仓库：<https://github.com/soybeanjs/soybean-admin>

soybean-admin 当前 README 显示其定位为 Vue 3、Vite、TypeScript、Pinia、UnoCSS 技术栈的后台管理模板，特性包含主题配置、国际化、文件路由、权限路由、403/404/500 页面、布局组件和移动端适配。

HeOS 借鉴以下模型：

- 后台管理布局：侧边导航、顶部操作区、内容区、系统状态入口。
- 权限路由：静态路由与服务端菜单配置并存。
- 主题配置、国际化预留、异常页面和移动端适配。
- 菜单元数据驱动导航和按钮显示。

HeOS 不采用以下内容：

- Vue、Pinia、NaiveUI、UnoCSS 技术栈。
- soybean-admin 的目录结构、构建脚本和组件实现。
- Mock 数据方案作为生产接口边界。

## 3. HeOS 技术约束

- 前端继续采用 TanStack Start、TanStack Router、React 19、Tailwind CSS 和现有 shadcn/ui 依赖。
- 运行时继续采用 Cloudflare Workers。
- 关系型业务数据优先进入 Cloudflare D1。
- 低频配置与菜单缓存进入 KV 的设计评估范围。
- 供应商账号、系统密钥和生产会话信息不进入浏览器。
- 权限校验发生在服务端函数或服务端路由中，前端权限只负责显示控制。

## 4. 权限域模型

一期权限域包含以下实体：

|实体|说明|一期边界|
|---|---|---|
|`Tenant`|租户|隔离客户、学校农场、园区、合作社和内部运营空间。|
|`OrgUnit`|组织单元|支持部门、基地、项目组等树形结构。|
|`User`|用户|绑定租户、组织、岗位和状态。|
|`Role`|角色|承载菜单权限、按钮权限、数据范围和管理范围。|
|`Post`|岗位|记录用户职责，不直接等同权限。|
|`Menu`|菜单|驱动后台导航、路由入口和模块归属。|
|`Permission`|权限点|覆盖页面访问、按钮操作、导出、审批、设备控制和系统配置。|
|`RolePermission`|角色权限绑定|记录角色与权限点、菜单和数据范围的关系。|
|`DataScope`|数据范围|限制租户、项目、基地、设备、作物周期和任务数据。|
|`AuditLog`|审计记录|记录登录、查询、导出、权限变更、控制申请、供应商同步和 AI 调用。|

## 5. 权限码规范

权限码采用稳定英文代码，按业务域分组：

```text
tenant:user:read
tenant:user:write
tenant:role:read
tenant:role:write
project:site:read
project:site:write
device:telemetry:read
device:control:request
alert:rule:write
trace:archive:export
system:audit:read
system:config:write
```

命名规则：

- 第一段为业务域。
- 第二段为资源。
- 第三段为动作。
- 高风险动作使用明确动词，例如 `request`、`approve`、`export`。
- 设备控制权限单独建码，不与设备读取权限共用。

## 6. 数据范围

一期数据范围包含：

|范围|代码|说明|
|---|---|---|
|全平台|`all`|平台管理员使用，覆盖全部租户。|
|本租户|`tenant`|租户管理员使用，限制在当前租户。|
|本组织及下级|`org_tree`|组织管理员使用，覆盖组织树下级。|
|本人项目|`assigned_projects`|项目负责人和农艺师使用。|
|只读公开|`readonly_public`|监管查看、访客和教学查看使用。|

所有业务查询必须从会话解析 `tenantId`、`userId`、`roleIds` 和 `dataScope`，服务端据此生成查询条件。前端不得自行拼接越权查询参数。

## 7. 后台管理壳层

一期后台壳层包含以下模块：

|模块|页面|说明|
|---|---|---|
|工作台|总览、待办、告警、近期同步|当前 demo 首页升级为登录后的工作台。|
|租户权限|租户、组织、用户、岗位、角色、菜单、权限点|先完成列表、详情、创建和停用规格。|
|资产管理|项目、基地、地块、大棚、设备|承接农业业务主数据。|
|监测告警|实时数据、历史数据、告警规则、告警记录|依赖遥测和告警模型。|
|农事追溯|作物周期、农事任务、投入品、追溯档案|承接现场作业中枢。|
|系统管理|字典、参数、供应商账号、审计日志|承接标准字典和安全审计。|

## 8. 路由与菜单

HeOS 后台路由分三层：

1. 公开路由：`/` demo 入口、`/login` 登录页和错误页。
2. 登录路由：`/console` 及其子路由。
3. 管理路由：`/console/system/*`、`/console/tenant/*` 等需要权限点的路由。

菜单数据包含：

```ts
type ConsoleMenuItem = {
  id: string
  parentId: string | null
  title: string
  route: string
  icon: string
  permissionCode: string | null
  order: number
  visible: boolean
}
```

服务端根据用户角色返回可见菜单。客户端渲染菜单时只使用服务端返回结果。

## 9. 验收标准

- 规格文档明确 RuoYi 与 soybean-admin 的参考范围和排除范围。
- Issue 中记录权限管理与后台壳层的交付边界。
- 后续实现必须包含 `Tenant`、`OrgUnit`、`User`、`Role`、`Menu`、`Permission`、`DataScope` 和 `AuditLog` 的最小模型设计。
- 后续实现必须将 `/console` 作为登录后后台入口。
- 后续实现必须支持服务端菜单过滤和服务端权限校验。
- 后续实现必须保留当前公开 demo 入口。
- 后续实现必须通过 `pnpm test` 和 `pnpm build`。

## 10. 非目标

- 不在本规格内实现完整后台页面。
- 不在本规格内接入第三方 OIDC。
- 不在本规格内实现设备控制审批流。
- 不在本规格内迁移到 Java、Vue 或其他后台模板技术栈。
- 不在本规格内生成通用 CRUD 代码生成器。

## 11. 后续任务建议

1. `S0-03` 建立权限管理与后台壳层规格。
2. `S1-04` 建立权限与菜单 D1 模型。
3. `S2-04` 建立会话上下文、权限校验和菜单查询服务端函数。
4. `S3-03` 建立 `/console` 后台壳层和权限路由。
5. `S4-03` 建立权限变更审计和最小验收报告。

## 12. 相关任务

- GitHub Issue: https://github.com/zbzailabs/HeOS/issues/18
- 关联 PRD: `docs/heos-prd/01-产品需求.md`
- 关联验收: `docs/heos-prd/05-验收标准.md`
