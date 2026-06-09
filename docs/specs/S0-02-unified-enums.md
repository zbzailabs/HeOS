# S0-02 跨模块枚举统一规格

版本日期：2026-06-09

## 1. 目标

建立 HeOS 一期跨模块枚举单源定义，覆盖遥测指标、告警类型、告警级别、同步状态、遥测质量和设备在线状态。后续数据模型、接口、页面、告警规则和标准稽核均引用该定义。

## 2. 范围

本任务覆盖：

- `MetricCode`
- `AlertType`
- `AlertLevel`
- `SyncStatus`
- `TelemetryQuality`
- `DeviceOnlineStatus`

本任务不覆盖：

- 数据库存储表
- D1 迁移
- Renke 接口调用
- 页面展示
- 告警生成逻辑

## 3. 约束

- 枚举值使用稳定英文代码。
- 同一枚举内不允许重复值。
- 指标定义包含默认单位。
- 告警级别包含排序权重。
- 同步状态覆盖成功、部分成功、失败、待重试、鉴权超时、源站超时、结构不匹配。

## 4. 验收标准

- 查询、写入、展示使用同一枚举来源。
- `MetricCode` 中每个指标都有默认单位。
- `AlertLevel` 中每个级别都有顺序值。
- `SyncStatus` 包含 `AUTH_TIMEOUT`、`SCHEMA_MISMATCH`、`SOURCE_TIMEOUT`。
- 测试覆盖枚举值唯一性、核心指标单位、告警级别顺序、同步状态完整性。

## 5. 相关任务

- GitHub Issue: https://github.com/zbzailabs/HeOS/issues/5
- 关联 Spec: `docs/heos-prd/06-标准对齐规格-v0.1.md`
- 关联任务清单: `docs/heos-prd/06-标准对齐任务清单-v0.1.md`

