# S1-01 TelemetryLatest 与 TelemetryHistory 规格

关联 Issue：[#6](https://github.com/zbzailabs/HeOS/issues/6)

## 目标

建立 HeOS 一期遥测数据底座，支持设备指标最近值、历史采样、重复采样幂等处理和稳定分页查询。数据模型面向 Cloudflare D1，接口层复用 TypeScript 单源定义生成写入计划和查询边界。

## 范围

本任务交付以下内容：

- `heos_telemetry_latest`：设备指标最近值表。
- `heos_telemetry_history`：设备指标历史采样表。
- `src/domain/telemetry/model.ts`：遥测采样、最近值、历史记录、写入计划、查询分页的单源定义。
- 单元测试覆盖唯一约束、重复采样幂等、时间窗口、稳定分页、单位和枚举引用。

本任务不交付 Renke 客户端、HTTP API、告警生成、设备资产表和页面展示。

## 数据模型

`TelemetryLatest` 以 `tenantId/siteId/deviceId/metricCode` 作为唯一业务键，每个设备每个指标仅保留最近一条：

- 新采样时间晚于或等于当前记录时，更新最近值。
- 新采样时间早于当前记录时，保留当前最近值。
- `unit` 来自 `MetricCode` 默认单位或上游标准化后的合法单位。
- `quality` 使用统一枚举 `TelemetryQuality`。

`TelemetryHistory` 保存采样明细：

- `sample_key` 使用 `tenantId/siteId/deviceId/metricCode/source/observedAt` 生成。
- `sample_key` 唯一，重复采样写入使用 `ON CONFLICT DO NOTHING`。
- 查询索引覆盖 `tenantId/siteId/deviceId/metricCode/observedAt/id`。

## D1 约束

迁移使用 SQLite 兼容语法：

- 主键使用 `TEXT PRIMARY KEY`。
- 时间字段使用 ISO 8601 字符串。
- 数值字段使用 `REAL`。
- 布尔值或状态不用非 SQLite 类型。
- `metric_code`、`quality` 使用 `CHECK` 约束限定当前枚举。
- `heos_telemetry_latest` 设置 `UNIQUE (tenant_id, site_id, device_id, metric_code)`。
- `heos_telemetry_history` 设置 `sample_key TEXT NOT NULL UNIQUE`。

## 写入策略

采样写入生成两类操作：

- 最近值 upsert：冲突目标为 `tenant_id/site_id/device_id/metric_code`，仅在新采样时间不早于当前记录时更新。
- 历史 insert：冲突目标为 `sample_key`，重复采样忽略。

## 查询策略

历史查询参数包含：

- `tenantId`
- `siteId`
- `deviceId`
- `metricCode`
- `fromTs`
- `toTs`
- `order`
- `limit`
- `cursor`

校验规则：

- `fromTs <= toTs`。
- `limit` 上限为 200。
- 稳定排序字段为 `observedAt` 和 `id`。
- 升序分页使用 `observedAt > cursor.observedAt OR observedAt = cursor.observedAt AND id > cursor.id`。
- 降序分页使用 `observedAt < cursor.observedAt OR observedAt = cursor.observedAt AND id < cursor.id`。

## 验收

- `TelemetryLatest` 每设备每指标仅保留最近一条。
- 重复采样写入不会产生重复主键。
- `TelemetryHistory` 支持按设备、指标、时间窗口查询。
- 历史查询返回稳定分页。
- `pnpm test` 通过。
- `pnpm build` 通过。
