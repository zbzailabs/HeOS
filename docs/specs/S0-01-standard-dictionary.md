# S0-01 标准术语与单位字典规格

关联 Issue：[#4](https://github.com/zbzailabs/HeOS/issues/4)

## 目标

建立 HeOS 一期 `StandardDictionary` 基础字典，作为作物、生育期、指标、单位、设备能力和告警级别的单一标准来源。数据库表保存字典条目和变更记录，TypeScript 模块提供接口层复用的码表引用、重复值校验和枚举一致性校验。

## 范围

本任务交付以下内容：

- `heos_standard_dictionary`：标准字典表。
- `heos_standard_dictionary_changes`：字典变更记录表。
- `src/domain/standards/dictionary.ts`：标准字典基础集、码表引用和校验函数。
- 单元测试覆盖字段完整性、唯一性、枚举一致性、单位引用和 D1 迁移边界。

本任务不交付字典维护页面、D1 运行时查询 API、批量导入工具和外部标准同步。

## 字典分类

一期基础集包含：

- `crop`：作物。
- `growth_stage`：生育期。
- `metric`：遥测指标。
- `unit`：指标单位。
- `device_capability`：设备能力。
- `alert_level`：告警级别。

## 字段

每条字典记录包含：

- `code`：稳定编码。
- `version`：字典版本，初始为 `v0.1`。
- `source`：来源标识。
- `effectiveFrom`：生效时间。
- `effectiveTo`：失效时间，当前有效记录为 `null`。

数据库字段采用 snake_case，接口和 TypeScript 模块采用 camelCase。

## 数据库约束

`heos_standard_dictionary` 使用 D1/SQLite 兼容语法：

- 主键为 `id TEXT PRIMARY KEY`。
- `category/code/version` 组合唯一。
- `category`、`status` 使用 `CHECK` 约束限定取值。
- `unit` 为可空字段，供 `metric` 分类引用 `unit` 分类编码。
- `effective_from` 不允许为空，`effective_to` 允许为空。

`heos_standard_dictionary_changes` 记录字典创建、更新、停用和恢复：

- 每条变更绑定字典条目 `dictionary_id`。
- 保存 `category/code/version` 快照。
- `change_type` 限定为 `create/update/deprecate/restore`。
- `changed_fields_json` 保存变更字段。
- `reason` 和 `source` 保存变更原因与来源。

## 校验规则

接口层复用字典模块的结构化错误：

- 重复 `category/code/version` 返回 `400`。
- `metric` 字典与 `MetricCode` 枚举不一致返回 `400`。
- `alert_level` 字典与 `AlertLevel` 枚举不一致返回 `400`。
- `metric` 引用的 `unit` 在 `unit` 字典中不存在返回 `400`。
- 错误体包含 `table`、`category` 和 `dictionaryReference`，便于调用方定位码表。

## 验收

- 字典条目具备版本、来源和生效时间。
- 基础数据随 D1 迁移进入字典表，并写入初始变更记录。
- 重复值校验返回规范的 `400` 错误。
- 字典与统一枚举不一致时返回 `400`，并提供码表引用。
- `pnpm test` 通过。
- `pnpm build` 通过。
