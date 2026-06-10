# S1-02 Alert 与 StandardRule 规格

关联 Issue：[#7](https://github.com/zbzailabs/HeOS/issues/7)

## 目标

建立 HeOS 一期告警规则和告警记录底座，支持阈值告警、离线告警、供应商告警与数据质量告警并行存在。规则触发结果具备原因、触发值、阈值、建议动作、触发时间、处置状态和审计来源。

## 范围

本任务交付以下内容：

- `heos_standard_rules`：标准规则表。
- `heos_alerts`：告警记录表。
- `src/domain/alerts/model.ts`：规则校验、告警生成计划、当前告警去重键和处置状态定义。
- 单元测试覆盖阈值规则、离线规则、非法阈值、并行告警、重复告警抑制和 D1 迁移边界。

本任务不交付 HTTP API、真实 D1 查询、规则编辑页面、通知发送和自动控制下发。

## 数据模型

`StandardRule` 用统一结构表达：

- `tenantId`
- `ruleId`
- `ruleType`
- `metricCode`
- `level`
- `threshold`
- `lower`
- `upper`
- `effectiveFrom`
- `effectiveTo`
- `action`
- `version`
- `status`

阈值规则至少包含 `lower` 或 `upper`。离线规则使用 `offline_after_seconds`，默认 300 秒。

`Alert` 必填字段：

- `tenantId`
- `siteId`
- `deviceId`
- `alertType`
- `level`
- `metricCode`
- `threshold`
- `valueObserved`
- `createdAt`
- `suggestedAction`
- `createdBy`
- `status`

规则触发的告警写入 `createdBy=system-rule`。

## 去重策略

当前未关闭告警按以下业务键去重：

`tenantId/siteId/deviceId/alertType/metricCode/ruleId`

离线告警与阈值告警的 `alertType` 不同，因此可以并行存在。重复触发同一规则时，保留当前打开告警，不重复创建。

## D1 约束

- SQL 使用 SQLite/D1 兼容语法。
- 主键使用 `TEXT`。
- 布尔值使用 `INTEGER`，取值 `0` 或 `1`。
- 时间字段使用 ISO 8601 字符串。
- `rule_type`、`level`、`status`、`created_by` 使用 `CHECK` 约束限定枚举。
- `heos_alerts` 设置当前告警业务键索引，便于重复告警抑制。

## 验收

- 告警规则字段与接口返回一致。
- 离线告警与阈值告警可并行存在。
- 异常状态不重复刷屏。
- 规则触发的告警写入 `createdBy=system-rule`。
- `pnpm test` 通过。
- `pnpm build` 通过。
