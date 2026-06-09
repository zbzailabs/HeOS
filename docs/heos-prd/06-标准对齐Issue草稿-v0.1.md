# HeOS 标准对齐 Issue 任务草稿 v0.1

版本日期：2026-06-09

> 用法：把每条任务复制到 GitHub Issue，标签建议 `ready-for-agent` + `needs-triage`，标题前加 `heos-standards-v0.1`。

## Issue 模板

### 标题
`[Standards] {任务编号} {任务名称}`

### 标准字段（必填）

- 任务编号：
- 关联 Spec：`docs/heos-prd/06-标准对齐规格-v0.1.md`
- 关联范围：
  - `06-标准对齐任务清单-v0.1.md` 条目
- 验收边界：
- 风险等级：`P0/P1/P2`
- 预计周期：
- 负责人：
- 相关文件：

### 验收命令

```bash
pnpm test
pnpm build
```

必要时补充：

- 接口冒烟脚本
- 数据库迁移检查
- 标准稽核快照导出

## Issue 一览（可直接建单）

## 已创建 Issue 对照

|任务编号|GitHub Issue|
|---|---|
|S0-01|https://github.com/zbzailabs/HeOS/issues/4|
|S0-02|https://github.com/zbzailabs/HeOS/issues/5|
|S1-01|https://github.com/zbzailabs/HeOS/issues/6|
|S1-02|https://github.com/zbzailabs/HeOS/issues/7|
|S1-03|https://github.com/zbzailabs/HeOS/issues/8|
|S2-01|https://github.com/zbzailabs/HeOS/issues/9|
|S2-02|https://github.com/zbzailabs/HeOS/issues/10|
|S2-03|https://github.com/zbzailabs/HeOS/issues/11|
|S3-01|https://github.com/zbzailabs/HeOS/issues/12|
|S3-02|https://github.com/zbzailabs/HeOS/issues/13|
|S4-01|https://github.com/zbzailabs/HeOS/issues/14|
|S4-02|https://github.com/zbzailabs/HeOS/issues/15|

### S0-01 标准术语与单位字典

- 标题：`[Standards] S0-01 建立标准术语与单位字典`
- 描述：
  - 建立 `StandardDictionary` 基础字典并落到数据库。
  - 包含作物、生育期、指标、设备能力、告警级别。
  - 字段要求包含 `code`、`version`、`source`、`effectiveFrom`。
- 验收标准：
  - 字典变更记录完整。
  - 重复值有唯一校验并返回规范错误。

### S0-02 跨模块枚举统一

- 标题：`[Standards] S0-02 建立跨模块枚举统一文件`
- 描述：
  - 实现 `MetricCode`、`AlertType`、`AlertLevel`、`SyncStatus` 集中定义。
- 验收标准：
  - 无重复定义。
  - 所有查询/展示使用统一枚举。

### S1-01 `TelemetryLatest` 与 `TelemetryHistory`

- 标题：`[Standards] S1-01 实现 TelemetryLatest 与 TelemetryHistory`
- 描述：
  - 按 `tenantId/siteId/deviceId/metricCode` 设计唯一约束。
  - 实现采样幂等写入。
- 验收标准：
  - 重复样本入库不产生重复主键。
  - 历史查询支持稳定分页。

### S1-02 `Alert` 与标准规则表

- 标题：`[Standards] S1-02 实现 Alert 与标准规则表`
- 描述：
  - 实现告警与规则字段：规则原因、阈值、触发值、建议动作。
- 验收标准：
  - 离线/阈值告警可并行展示。
  - 异常不重复刷屏。

### S1-03 审计日志字段扩展

- 标题：`[Standards] S1-03 扩展 AuditLog 标准字段`
- 描述：
  - 补齐 `traceId/userId/tenantId/action/target/result/latencyMs`。
- 验收标准：
  - 登录、导出、查询、控制申请、同步事件均落库。

### S2-01 Renke 同步标准化

- 标题：`[Standards] S2-01 标准化 Renke 同步 API`
- 描述：
  - 标准化同步结果摘要。
  - 处理 `AUTH_TIMEOUT`、`SCHEMA_MISMATCH`、`SOURCE_TIMEOUT`。
- 验收标准：
  - 同步失败可观测、可重试。

### S2-02 遥测查询接口

- 标题：`[Standards] S2-02 建立遥测查询接口`
- 描述：
  - 提供 `/api/telemetry/latest` 与 `/api/telemetry/history`。
  - 实现参数校验与时间窗口约束。
- 验收标准：
  - 无效参数返回标准错误。

### S2-03 标准规则管理接口

- 标题：`[Standards] S2-03 标准规则管理 API`
- 描述：
  - 实现规则增删改查与校验接口。
- 验收标准：
  - 规则版本强制存在。
  - 非法阈值拒绝。

### S3-01 在线与离线展示

- 标题：`[Standards] S3-01 在线状态与离线告警前端展示`
- 描述：
  - 设备列表展示在线状态。
  - 告警页面支持离线原因与触发时间。
- 验收标准：
  - 5 分钟离线规则准确。

### S3-02 标准稽核页

- 标题：`[Standards] S3-02 标准稽核页`
- 描述：
  - 展示 `/api/compliance/checklist` 的覆盖与缺口。
  - 支持快照导出。
- 验收标准：
  - 未覆盖关键项显示阻断标记。

### S4-01 发布冻结前 compliance-report

- 标题：`[Standards] S4-01 生成发布冻结 compliance-report`
- 描述：
  - 发布前输出未达标项与整改计划。
- 验收标准：
  - 每个发布产物附合规报告。

### S4-02 任务边界与验收固化

- 标题：`[Standards] S4-02 任务边界与验收命令固化`
- 描述：
  - 对齐 `docs/HeOS 产品需求文档20260608.md` 与任务边界。
  - 明确发布未完成项。
- 验收标准：
  - 版本提交说明包含任务清单、验收结果、遗留项。

## 发布约束（Issue 通用）

- 默认阻塞：`S0`、`S1` 任务全部完成后才能进入 `ready-for-human`。
- 一旦出现 schema 与接口不一致，立即创建缺陷 Issue，阻塞发布。
- 每个 Issue 需在最后贴出 `docs/heos-prd/06-标准对齐规格-v0.1.md` 引用。
