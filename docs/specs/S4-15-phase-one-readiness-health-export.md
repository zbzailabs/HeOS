# S4-15 一期验收收口、生产健康检查与 R2 导出边界

## 1. 背景

HeOS 一期已经完成生产入口、Renke 同步、D1 查询、告警流转、农事记录、公开追溯、AI 人工确认和生产写入 API 鉴权。当前任务对一期可验收状态做收口，补充持续性健康检查和追溯导出边界，减少后续验收依赖人工临时查询。

本任务继续采用 Spec-Driven Development。先固定规格、验收标准和边界，再补测试、实现和部署记录。

## 2. 范围

- 新增只读生产健康检查 API：`GET /api/operations/health`。
- 健康检查覆盖 D1 表计数、最近 Renke 同步、最新遥测时间、开放告警数量、AI provider 24 小时窗口。
- 新增追溯导出计划边界，生成稳定 R2 object key 和审计动作说明。
- 清理过时初始化文档表述，使 `DESIGN.md` 和技术架构反映当前一期生产状态。
- 合规清单加入 S4-14 与 S4-15 收口证据。

## 3. 健康检查规则

|检查项|通过标准|
|---|---|
|D1 基础表|核心表查询成功，并返回当前计数。|
|Renke 最近同步|最近同步状态为 `success`，或返回明确失败状态和错误信息。|
|遥测最新时间|`heos_telemetry_latest` 存在最新 `observed_at`。|
|开放告警|返回开放告警数量，不因数量大于 0 判定失败。|
|AI provider|返回 24 小时调用数、失败数和最近更新时间；无记录返回 0 和 `null`。|

总状态分为：

- `healthy`：关键检查通过。
- `degraded`：存在同步失败、遥测缺失或 D1 查询失败。

## 4. R2 与导出边界

- 当前任务不上传真实文件。
- 导出计划生成 `r2://heos-exports/{tenantId}/trace/{publicSlug}/{format}/{traceArchiveId}-{generatedAt}.{ext}`。
- 支持 `pdf`、`docx`、`xlsx`、`json` 四种格式计划。
- 导出计划包含 `auditAction = trace.export`，后续真实写入时复用该动作。
- 业务表继续只保存对象 key、元数据、来源和归属关系。

## 5. 验收

- 健康检查领域函数具备单元测试。
- R2 导出计划具备单元测试。
- `/api/operations/health` 返回 `traceId`、`status`、`checks`。
- 合规清单包含 S4-14、S4-15。
- `pnpm test` 通过。
- `pnpm run build` 通过。
- `pnpm run test:e2e` 通过。

## 6. 不进入本任务

- 不做真实 R2 上传。
- 不生成 PDF、DOCX、XLSX 文件内容。
- 不新增 OIDC 或多用户管理页面。
- 不修改生产 D1 schema。
