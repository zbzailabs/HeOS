# S2-10 AI 交互 D1 写入 API

关联 Issue：[#53](https://github.com/zbzailabs/HeOS/issues/53)

## 1. 目标

在 S2-09 写入计划基础上，建立服务端 D1 写入边界。`/api/core/ai-interactions` 支持 POST，把 AI 交互摘要、授权检索来源和审计记录写入现有 D1 表。

## 2. 范围

- 新增 AI D1 repository。
- 为 `/api/core/ai-interactions` 增加 POST handler。
- 复用 `heos_ai_interactions` 与 `heos_audit_logs`。
- 复用 S2-09 的来源校验、高风险人工确认校验和审计 metadata。

## 3. 不做范围

- 不接真实模型调用。
- 不保存 AI Key、完整 prompt 或完整模型输出。
- 不新增 D1 表结构。
- 不新增页面。

## 4. API 边界

- 请求体必须是 JSON object。
- 未配置 `HEOS_DB` 返回 503。
- 校验失败返回 400，错误结构沿用 S2-09。
- 成功返回 `traceId`、`interactionId` 和 `auditLogId`。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/ai/interaction.test.ts src/domain/ai/d1-repository.test.ts src/domain/ai/api.test.ts
pnpm test
pnpm run build
git diff --check
```
