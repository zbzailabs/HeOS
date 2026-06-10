# S2-03 标准规则管理 API 规格

关联 Issue：[#11](https://github.com/zbzailabs/HeOS/issues/11)

## 目标

建立标准规则管理接口契约，支持规则创建、规则更新和规则校验。接口围绕 `StandardRule` 单源模型工作，非法阈值拒绝写入，规则变更生成审计写入计划。

## 范围

本任务交付以下内容：

- `src/domain/standards/rules-api.ts`：规则创建、更新、校验和审计写入计划。
- `src/lib/standard-rules.ts`：TanStack Server Functions 入口，承接创建、更新和校验请求。
- 单元测试覆盖 `POST /api/standards/rules`、`PATCH /api/standards/rules/{id}`、`GET /api/standards/rules/validation` 的核心行为。

本任务不交付真实 D1 持久化、真实 HTTP 文件路由和前端规则管理页面。当前项目尚无 API route 示例，本任务先交付稳定服务端函数契约，后续 HTTP 路由只作为薄封装调用同一服务层。

## 接口契约

### POST /api/standards/rules

创建规则，输入必须包含：

- `traceId`
- `actorUserId`
- `rule.version`
- `rule.ruleType`
- `rule.level`
- `rule.action`
- `rule.effectiveFrom`

成功返回规则写入计划和审计写入计划。

### PATCH /api/standards/rules/{id}

更新规则，输入必须包含：

- `traceId`
- `actorUserId`
- `currentRule`
- `patch`

更新后的规则保留原 `id`，版本号必须存在。成功返回规则写入计划和审计写入计划。

### GET /api/standards/rules/validation

校验规则，不写入数据。非法阈值、时间窗口、离线窗口返回结构化 `400` 错误。

## 审计

创建和更新规则均生成 `policy.change` 审计记录，字段包含：

- `traceId`
- `tenantId`
- `userId`
- `action=policy.change`
- `targetType=standard_rule`
- `targetId`
- `result`
- `latencyMs`

## 验收

- 规则保存必须带版本号。
- 非法阈值拒绝写入。
- 规则校验接口返回不合规原因。
- 规则变更写入审计日志。
- `pnpm test` 通过。
- `pnpm build` 通过。
