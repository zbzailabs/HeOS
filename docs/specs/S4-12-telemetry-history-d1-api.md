# S4-12 遥测历史 API D1 查询

关联 Issue：[#68](https://github.com/zbzailabs/HeOS/issues/68)

## 1. 目标

将 `/api/telemetry/history` 接入 `heos_telemetry_history` D1 查询，使历史曲线接口优先返回真实采样数据。D1 不可用、查询失败或没有记录时，接口继续使用现有演示数据降级，保持前端可用。

## 2. 背景

一期验收要求仁科设备按单个指标查看历史曲线，且单设备单指标 7 天历史数据查询在 3 秒内返回。当前遥测模型、D1 migration 和查询计划已具备，`/api/telemetry/latest` 已读取 D1；历史接口仍只返回演示数据，需要补齐 D1 读取证据。

## 3. 范围

- 新增 telemetry D1 查询仓储。
- 复用 `createTelemetryHistoryQueryPlan()` 生成过滤、排序、limit 和 cursor 参数。
- `/api/telemetry/history` 在 `HEOS_DB` 可用时优先读取 D1。
- D1 缺失、查询失败或无记录时保留 demo 降级。
- 更新发布稽核清单中 S2-02 的证据和计划。

## 4. 验收标准

- D1 SQL 包含 `tenant_id`、`site_id`、`device_id`、`metric_code`、`observed_at` 时间窗口过滤。
- D1 SQL 使用 `observed_at` 与 `id` 稳定排序。
- 返回记录映射为现有 `TelemetryHistoryRecord` 结构。
- `nextCursor` 取当前页最后一条记录。
- 发布稽核 S2-02 引用 D1 历史查询仓储，不再写“生产环境切换为 D1 查询实现”。

## 5. 不做范围

- 不新增 D1 migration。
- 不修改遥测写入逻辑。
- 不修改 Renke 同步逻辑。
- 不新增前端图表。

## 6. 验证命令

```bash
pnpm exec vitest run src/domain/telemetry/d1-query.test.ts src/domain/compliance/checklist.test.ts
pnpm test
pnpm run build
git diff --check
```
