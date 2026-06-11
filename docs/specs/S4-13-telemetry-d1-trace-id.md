# S4-13 遥测 D1 查询 traceId 贯通

关联 Issue：[#69](https://github.com/zbzailabs/HeOS/issues/69)

## 1. 目标

将 `/api/telemetry/latest` 与 `/api/telemetry/history` 的 D1 成功响应 traceId 统一为请求解析阶段生成的 traceId，保证遥测查询 API 在生产 D1 分支、demo 降级分支和错误分支都具备同一请求标识。

## 2. 背景

一期验收要求关键接口记录 trace id、用户、租户、耗时和结果。当前遥测查询错误分支和 demo 分支已经沿用请求 traceId，D1 成功分支仍返回固定字符串，不利于生产排障和发布稽核引用。

## 3. 范围

- `/api/telemetry/latest` D1 成功响应返回调用方传入的 traceId。
- `/api/telemetry/history` D1 成功响应返回调用方传入的 traceId。
- D1 缺失、查询失败或无记录时保留 demo 降级。
- 发布冻结报告引用 D1 查询、traceId 贯通和当前发布核验证据。

## 4. 验收标准

- D1 latest 成功响应 traceId 等于请求解析 traceId。
- D1 history 成功响应 traceId 等于请求解析 traceId。
- 合规清单 S2-02 引用本规格和遥测 D1 traceId 证据。
- 发布冻结报告不再保留已完成事项的过时后续计划。

## 5. 不做范围

- 不新增 D1 migration。
- 不修改遥测写入逻辑。
- 不修改 Renke 同步逻辑。
- 不新增前端图表。

## 6. 验证命令

```bash
pnpm exec vitest run src/domain/telemetry/d1-api.test.ts src/domain/telemetry/d1-query.test.ts src/domain/compliance/checklist.test.ts
pnpm test
pnpm run build
git diff --check
```
