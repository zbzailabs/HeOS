# S4-14 生产写入 API 服务端鉴权

## 1. 背景

HeOS 一期已经完成 Renke 同步、告警流转、农事执行、追溯归档和 AI 人工确认等生产写入入口。当前阶段将页面登录保护推进到 API handler 内部，保证生产写入动作不依赖前端显示状态。

本任务继续采用 Spec-Driven Development。先固定鉴权规格、验收标准和边界，再补测试和代码。

## 2. 范围

- 为生产写入 API 建立统一服务端访问校验函数。
- 覆盖未登录、缺少权限、租户范围不匹配和允许写入四类结果。
- 为告警状态流转、农事任务状态流转、AI 人工确认和 Renke 手动同步入口绑定独立权限码。
- 写入审计时使用当前登录用户标识，不继续默认使用固定管理员用户。

## 3. 权限映射

|写入入口|权限码|说明|
|---|---|---|
|`POST /api/core/alerts`|`alert:write`|告警确认、处理、关闭。|
|`POST /api/core/agri-tasks`|`agri:task:write`|农事任务执行、验收和追溯归档。|
|`POST /api/core/ai-reviews`|`ai:review:write`|AI 建议人工确认和拒绝。|
|`POST /api/providers/renke/sync`|`provider:sync:write`|人工触发供应商同步。|

## 4. 鉴权规则

1. 未登录请求返回 `401 AUTHENTICATION_REQUIRED`。
2. 已登录但缺少所需权限返回 `403 PERMISSION_DENIED`，响应包含缺失权限码。
3. 非 `all` 数据范围的用户只能写入本人 `tenantId` 下的数据；租户不匹配返回 `403 TENANT_SCOPE_DENIED`。
4. `all` 数据范围的管理员通过权限校验后允许写入指定租户数据。
5. API handler 必须在执行 D1 写入、Renke 外部请求或队列投递之前完成鉴权。
6. 写入仓储使用当前登录用户标识作为 `userId`，请求体中的 `userId` 不作为可信身份来源。

## 5. 验收标准

- 生产写入鉴权函数具备单元测试，覆盖未登录、缺权限、租户不匹配和允许写入。
- 权限码在 `permissionCodes` 和 `permissionDefinitions` 中单源定义。
- 告警、农事、AI 人工确认和 Renke 手动同步 handler 复用同一鉴权函数。
- `pnpm test` 通过。
- `pnpm run build` 通过。

## 6. 不进入本任务

- 不改登录方式和 session cookie 格式。
- 不接入 OIDC。
- 不新增真实多租户用户管理页面。
- 不开放设备控制命令。
