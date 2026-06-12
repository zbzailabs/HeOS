# HeOS 发布冻结合规报告

版本日期：2026-06-11

## 1. 汇总

- 检查项：16
- 已覆盖：16
- 进行中：0
- 未达标：0
- 阻断项：0
- 验收命令：`pnpm test`、`pnpm build`

## 2. 已覆盖检查明细

### S1-05 PRD 核心业务域 D1 模型

- Issue：#32
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S1-05-prd-core-domain-model.md`、`db/migrations/0004_heos_prd_core_domains.sql`、`src/domain/core/prd-model.ts`
- 后续计划：继续运行核验生产 D1 seed、核心查询 D1 repository 和控制台 D1 数据合并结果。

### S2-06 Renke D1 同步与失败重试

- Issue：#35
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S2-06-renke-d1-sync-retry.md`、`src/domain/renke/sync.ts`、`src/routes/api/providers/renke/sync.ts`
- 后续计划：继续运行核验 Cron Triggers、Queues、同步重放和失败处理证据。

### S2-02 遥测查询 API

- Issue：#10
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-12-telemetry-history-d1-api.md`、`docs/specs/S4-13-telemetry-d1-trace-id.md`、`src/domain/telemetry/api.ts`、`src/domain/telemetry/d1-api.ts`、`src/domain/telemetry/d1-query.ts`、`src/routes/api/telemetry/latest.ts`、`src/routes/api/telemetry/history.ts`
- 后续计划：继续核验 D1 查询、时间窗口、稳定分页、traceId 贯通和 demo 降级行为。

### S3-01 在线状态与离线告警前端展示

- Issue：#12
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/alerts/offline.ts`、`src/domain/production/actions.ts`、`src/routes/api/core/alerts.ts`、`src/routes/console.tsx`
- 后续计划：继续核验告警状态流转、恢复记录和审计写入结果。

### S3-02 标准稽核页

- Issue：#13
- 状态：已覆盖
- 阻断发布：否
- 证据：`src/domain/compliance/checklist.ts`、`src/routes/api/compliance/checklist.ts`、`src/routes/console.tsx`
- 后续计划：发布前导出合规快照并写入交付记录。

### S4-01 发布冻结 compliance-report

- Issue：#14
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/heos-prd/compliance-report.md`
- 后续计划：发布前刷新验证结果、部署记录和 GitHub Issue 完成记录。

### S4-02 任务边界与验收命令固化

- Issue：#15
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/heos-prd/06-标准对齐任务清单-v0.1.md`、`docs/heos-prd/05-验收标准.md`
- 后续计划：Issue、文档和验收记录保持互相引用。

## 3. 下一阶段检查明细

### S0-04 下一阶段规格与生产验收基线

- Issue：#36
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S0-04-next-stage-production-baseline.md`
- 验收重点：规格、验收命令、线上核验清单、构建无 `.inputValidator()` 废弃警告。

### S1-06 生产 D1 租户项目与种子数据

- Issue：#37
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S1-06-production-d1-seed.md`、`db/seeds/0001_tenglong_smart_farm.sql`、`src/domain/core/seed.test.ts`
- 验收重点：生产 D1 seed 幂等执行，腾龙小学智慧农场基础数据可查询。

### S2-07 核心查询接口切换 D1 repository

- Issue：#38
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S2-07-core-d1-query-api.md`、`src/domain/core/d1-query.ts`、`src/lib/core-api.ts`
- 验收重点：核心 API 优先读取 `HEOS_DB`，保留租户隔离、分页、筛选和 traceId。

### S2-08 Renke Cron Triggers、Queues 与同步重放

- Issue：#39
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S2-08-renke-cron-queues-replay.md`、`wrangler.jsonc`、`src/routes/api/providers/renke/replay.ts`
- 验收重点：Cron、队列消息、失败处理和最近同步状态。

### S3-06 告警、农事、追溯和 AI 业务流程页面

- Issue：#40
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S3-06-console-business-workflows.md`、`src/domain/console/workbench.ts`、`src/routes/console.tsx`
- 验收重点：告警和农事状态流转、追溯公开边界、AI 来源记录、移动端无溢出。

### S4-03 下一阶段发布验收与线上核验

- Issue：#41
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-03-next-stage-release-verification.md`
- 验收重点：线上关键路径、部署记录、GitHub Issue 和 GitHub Project 记录一致。

### S4-13 遥测 D1 查询 traceId 贯通

- Issue：#69
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-13-telemetry-d1-trace-id.md`、`src/domain/telemetry/d1-api.ts`、`src/domain/telemetry/d1-api.test.ts`、`src/routes/api/telemetry/latest.ts`、`src/routes/api/telemetry/history.ts`
- 验收重点：遥测 latest/history 的 D1 成功响应沿用请求 traceId。

### S4-14 生产写入 API 服务端鉴权

- Issue：#70
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-14-production-write-api-auth.md`、`src/domain/rbac/production-write-auth.ts`、`src/lib/auth.test.ts`、`src/routes/api/core/alerts.ts`、`src/routes/api/core/agri-tasks.ts`、`src/routes/api/core/ai-reviews.ts`、`src/routes/api/providers/renke/sync.ts`
- 验收重点：未登录写入返回 401，缺少权限返回 403，写入身份来自请求 session。

### S4-15 一期验收收口、生产健康检查与 R2 导出边界

- Issue：#71
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-15-phase-one-readiness-health-export.md`、`src/domain/operations/health.ts`、`src/domain/trace/export-plan.ts`、`src/routes/api/operations/health.ts`、`DESIGN.md`、`docs/heos-prd/02-技术架构.md`
- 验收重点：生产健康检查可持续复核，追溯导出具备 R2 object key 与 `trace.export` 审计边界。

### S4-17 追溯导出 JSON 文件写入 R2

- Issue：#73
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-17-trace-export-r2-json.md`、`src/domain/trace/export-plan.ts`、`src/domain/trace/export-plan.test.ts`、`src/routes/api/core/trace-exports.ts`、`src/domain/rbac/production-write-auth.ts`、`wrangler.jsonc`
- 验收重点：`POST /api/core/trace-exports` 从 D1 读取公开追溯档案，生成 JSON 文件，写入 `HEOS_EXPORTS` R2，回填导出对象引用并写入 `trace.export` 审计记录。

### S4-18 追溯 JSON 导出控制台入口

- Issue：#74
- 状态：已覆盖
- 阻断发布：否
- 证据：`docs/specs/S4-18-trace-export-console-action.md`、`src/domain/console/workbench.ts`、`src/domain/console/workbench.test.ts`、`src/lib/console-data-merge.ts`、`src/routes/console.tsx`、`tests/e2e/console-smoke.spec.ts`
- 验收重点：`/console` 追溯档案区展示“导出 JSON”按钮，调用 S4-17 API，展示 R2 `objectRef` 或错误提示。

## 4. 当前结论

截至本报告版本，一期收口无已识别发布阻断项。D1、Renke Cron/Queues、生产写入鉴权、健康检查、遥测 traceId、追溯公开页、追溯 JSON 文件 R2 上传和控制台导出入口均具备可复核证据；PDF、DOCX、XLSX 报表文件生成进入后续交付。
