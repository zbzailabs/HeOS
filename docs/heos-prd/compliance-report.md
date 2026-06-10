# HeOS 发布冻结合规报告

版本日期：2026-06-10

## 1. 汇总

- 检查项：7
- 已覆盖：7
- 未达标：0
- 阻断项：0
- 验收命令：`pnpm test`、`pnpm build`

## 2. 检查明细

### S1-05 PRD 核心业务域 D1 模型

- Issue：#32
- Spec：PRD 1-5 与验收 2-8
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S1-05-prd-core-domain-model.md`、`db/migrations/0004_heos_prd_core_domains.sql`、`src/domain/core/prd-model.ts`
- 未达标原因：无
- 后续计划：补齐 CRUD 页面、真实 D1 读写和运行链路。

### S2-01 标准化 Renke 同步 API

- Issue：#9
- Spec：Spec 5.2 供应商同步入口
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/renke/sync.ts`、`src/routes/api/providers/renke/sync.ts`
- 未达标原因：无
- 后续计划：接入 D1 写入、Cron Triggers、Queues 和失败重试。

### S2-02 遥测查询 API

- Issue：#10
- Spec：Spec 5.2 遥测查询
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/telemetry/api.ts`、`src/routes/api/telemetry/latest.ts`、`src/routes/api/telemetry/history.ts`
- 未达标原因：无
- 后续计划：生产环境切换为 D1 查询实现。

### S3-01 在线状态与离线告警前端展示

- Issue：#12
- Spec：Spec 5.1 在线判定、Spec 6.2
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/alerts/offline.ts`、`src/routes/console.tsx`
- 未达标原因：无
- 后续计划：接入真实告警关闭、恢复和审计记录。

### S3-02 标准稽核页

- Issue：#13
- Spec：Spec 5.2 标准稽核、Spec 6.1、Spec 7
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/compliance/checklist.ts`、`src/routes/api/compliance/checklist.ts`、`src/routes/console.tsx`
- 未达标原因：无
- 后续计划：每次发布前导出快照进入交付记录。

### S4-01 发布冻结 compliance-report

- Issue：#14
- Spec：Spec 6.1、Spec 7、Spec 9
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/heos-prd/compliance-report.md`
- 未达标原因：无
- 后续计划：发布前刷新验证结果和部署记录。

### S4-02 任务边界与验收命令固化

- Issue：#15
- Spec：Spec 1、Spec 6、Spec 9
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/heos-prd/06-标准对齐任务清单-v0.1.md`、`docs/heos-prd/05-验收标准.md`
- 未达标原因：无
- 后续计划：Issue、文档和验收记录保持互相引用。

## 3. 下一迭代目标

- 基于 S1-05 核心表补齐项目、作物、农事、追溯和 AI 页面。
- 将演示数据切换为 D1 查询结果。
- 将仁科同步接入 Cron Triggers、Queues 和失败重试。
- 将告警关闭、恢复和审计记录接入真实业务表。
