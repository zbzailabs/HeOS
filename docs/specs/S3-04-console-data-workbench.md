# S3-04 标准字典与遥测工作台首屏规格

关联 Issue：[#28](https://github.com/zbzailabs/HeOS/issues/28)

## 目标

将 S0-01 标准字典和 S1-01 遥测数据底座接入 `/console` 首屏，让后台管理工作台直接展示当前已具备的数据能力、D1 迁移状态和后续接入边界。

## 范围

本任务交付以下内容：

- `/console` 首屏展示标准字典覆盖情况。
- `/console` 首屏展示 `TelemetryLatest`、`TelemetryHistory` 的模型状态、示例最近值和历史查询边界。
- 新增工作台数据汇总模块，复用现有标准字典和遥测模型单源定义。
- 补充 Cloudflare D1 binding，使用 `db/migrations` 作为迁移目录。
- 执行线上 D1 migrations。

本任务不交付 Renke 客户端、HTTP 遥测 API、告警生成、业务 CRUD 页面和真实设备数据接入。

## 展示内容

### 标准字典

- 字典总条目数。
- 字典分类数。
- 当前版本。
- 分类明细：作物、生育期、指标、单位、设备能力、告警级别。

### 遥测模型

- 最近值表：`heos_telemetry_latest`。
- 历史表：`heos_telemetry_history`。
- 支持的指标数量。
- 幂等策略：最近值 upsert，历史采样 `sample_key` 去重。
- 示例最近值记录。
- 示例历史查询排序与分页。

### D1 状态

- binding：`HEOS_DB`。
- database：`heos`。
- migration 目录：`db/migrations`。
- 当前已包含迁移：RBAC、标准字典、遥测数据模型。

## 验收

- `/console` 首屏可见标准字典覆盖数量和分类。
- `/console` 首屏可见 `TelemetryLatest` 与 `TelemetryHistory` 状态。
- 页面明确显示 Renke/API 尚未接入时的空状态边界。
- D1 binding 存在，线上 migrations 执行成功。
- 移动端无横向滚动。
- `pnpm test` 通过。
- `pnpm build` 通过。
