# S2-09 AI 辅助授权来源与审计写入

关联 Issue：[#52](https://github.com/zbzailabs/HeOS/issues/52)

## 1. 目标

建立 AI 辅助交互写入边界。每次 AI 辅助记录必须包含授权检索来源、模型、输入摘要、输出摘要、成本、人工确认标记和审计记录。

## 2. 范围

- 使用现有 `heos_ai_interactions` 表保存 AI 辅助记录。
- 使用现有 `heos_audit_logs` 表保存审计记录。
- 领域模块提供纯函数写入计划，后续服务端函数和真实模型调用复用该计划。

## 3. 不做范围

- 不接入真实大模型调用。
- 不保存完整 prompt、完整输出、AI Key 或供应商密钥。
- 不新增前端页面。
- 不改变现有 D1 表结构。

## 4. 约束

- `retrievalSources` 不能为空。
- 每个检索来源的 `tenantId` 必须等于本次请求的 `tenantId`。
- 检索来源必须包含表名、目标 ID、标题和权限码。
- `agri_advice`、`alert_explanation` 和 `report_summary` 按高风险场景处理，必须要求人工确认。
- 审计记录使用 `ai.interaction.create`。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/ai/interaction.test.ts
pnpm test
pnpm run build
git diff --check
```
