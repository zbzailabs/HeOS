# S1-03 AuditLog 标准字段规格

关联 Issue：[#8](https://github.com/zbzailabs/HeOS/issues/8)

## 目标

统一 HeOS 一期审计日志字段，覆盖登录、导出、查询、控制申请、策略修改和供应商同步事件。审计记录必须包含请求 trace、用户、租户、动作、目标、结果和耗时，支持按租户、用户、动作和时间检索。

## 范围

本任务交付以下内容：

- `heos_audit_logs` 字段扩展迁移。
- `src/domain/audit/log.ts`：审计事件分类、动作、目标、记录规范化、查询边界和写入计划。
- 单元测试覆盖必填字段、事件类型、失败原因、检索索引和 D1 迁移边界。

本任务不交付真实 D1 写入、日志采集器、前端审计页面和外部 SIEM 集成。

## 标准字段

`AuditLog` 标准字段如下：

- `traceId`
- `tenantId`
- `userId`
- `eventType`
- `action`
- `targetType`
- `targetId`
- `targetName`
- `result`
- `resultReason`
- `latencyMs`
- `source`
- `metadataJson`
- `createdAt`

## 事件覆盖

一期必须覆盖以下事件类型：

- `auth.login`
- `trace.export`
- `telemetry.query`
- `device.control.request`
- `policy.change`
- `provider.sync`

## 查询边界

审计检索支持：

- 按 `tenantId` 和时间窗口检索。
- 按 `userId` 检索。
- 按 `action` 检索。
- 按 `traceId` 精确定位。

## D1 约束

- SQL 使用 SQLite/D1 兼容语法。
- 新增字段使用 `ALTER TABLE ... ADD COLUMN`。
- `latency_ms` 使用 `INTEGER`。
- `result` 限定为 `success` 或 `failure`。
- 高频检索字段建立索引。

## 验收

- 登录、导出、查询、控制申请、策略修改、供应商同步事件全部有标准事件类型。
- 审计记录包含 `traceId/userId/tenantId/action/target/result/latencyMs`。
- 关键事件可按租户、用户、动作和时间检索。
- `pnpm test` 通过。
- `pnpm build` 通过。
