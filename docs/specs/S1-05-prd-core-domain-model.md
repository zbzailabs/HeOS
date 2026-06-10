# S1-05 PRD 核心业务域 D1 模型规格

关联 PRD：`docs/heos-prd/01-产品需求.md`

## 目标

补齐 HeOS 一期主业务域的数据结构，使项目、基地、地块、大棚、设备、供应商账号、作物模型、农事任务、告警、控制命令、追溯、AI 辅助和报表具备统一 D1 表结构与 TypeScript 覆盖清单。

## 范围

本任务交付以下内容：

- D1 迁移：`db/migrations/0004_heos_prd_core_domains.sql`
- 领域覆盖定义：`src/domain/core/prd-model.ts`
- 单元测试：`src/domain/core/prd-model.test.ts`

本任务不交付完整 CRUD 页面、真实 R2 上传、真实 AI 模型调用和生产级队列执行器。这些能力在后续任务中基于本数据底座实现。

## 数据域

|PRD 域|核心表|
|---|---|
|项目、基地和空间资产|`heos_projects`、`heos_sites`、`heos_plots`、`heos_greenhouses`|
|设备与供应商接入|`heos_provider_accounts`、`heos_devices`、`heos_device_metric_mappings`、`heos_sync_runs`|
|作物模型|`heos_crop_models`、`heos_crop_model_stages`、`heos_crop_cycles`|
|农事管理|`heos_agri_tasks`、`heos_agri_task_records`|
|告警中心|`heos_standard_rules`、`heos_alerts`|
|控制策略|`heos_control_commands`|
|报表与追溯|`heos_trace_archives`、`heos_reports`|
|AI 辅助|`heos_ai_interactions`|

## 约束

- 所有核心业务表包含 `tenant_id`。
- 项目、基地、地块、大棚、设备逐级建立外键。
- 供应商账号只保存凭据引用，不保存明文密码。
- 控制命令默认 `disabled` 或 `pending_approval`，并包含幂等键、有效期、审批和回执字段。
- AI 调用记录模型、输入摘要、检索来源、输出摘要、成本和审计字段。
- 同步记录包含 trace id、供应商、开始时间、结束时间、成功数、失败数和错误码。

## 验收

- 迁移文件包含全部 PRD 主域表。
- 迁移不包含供应商明文密码字段。
- TypeScript 覆盖清单中的表名与迁移一致。
- `pnpm test` 通过。
- `pnpm build` 通过。
