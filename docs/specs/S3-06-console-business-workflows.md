# S3-06 告警、农事、追溯和 AI 业务流程页面

## 1. 范围

本规格覆盖 `/console` 主业务区块的流程化展示：

- 告警中心：开放、确认、处理、关闭。
- 农事任务：计划、执行、验收。
- 追溯档案：只展示公开字段。
- AI 辅助记录：展示授权来源和审计动作。

## 2. 实现

- `src/domain/console/workbench.ts` 暴露业务流程、权限码、审计动作和公开字段。
- `src/routes/console.tsx` 展示流程步骤、权限码、审计动作、追溯公开字段和 AI 来源策略。
- 告警和农事流转仍由后续写入接口承接，本阶段完成控制台可验收流程边界。

## 3. 验收

- `pnpm exec vitest run src/domain/console/workbench.test.ts`
- `pnpm build`
- `/console` 显示告警、农事、追溯和 AI 业务流程边界。
- 移动端布局采用单列和换行策略，不设置横向滚动。

