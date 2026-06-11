# S2-12 DeepSeek AI 建议与人工确认 API

关联 Issue：[#55](https://github.com/zbzailabs/HeOS/issues/55)

## 1. 目标

以 DeepSeek API 作为 HeOS 后续大模型底座，将 AI 授权来源建议草稿推进为服务端生成、D1 写入、人工确认和人工拒绝闭环。

## 2. 范围

- DeepSeek API 只在 Cloudflare Workers 服务端调用。
- DeepSeek 密钥通过 Workers Secret `DEEPSEEK_API_KEY` 注入，不进入前端代码和 Git 仓库。
- 默认模型为 `deepseek-v4-flash`，通过 `DEEPSEEK_MODEL` 覆盖。
- `/api/core/ai-interactions` 的 `mode: "draft"` 使用 DeepSeek 生成建议草稿。
- `/api/core/ai-reviews` 支持人工确认和人工拒绝。
- 人工处理记录进入 `heos_ai_review_actions`。

## 3. 不做范围

- 不提交 DeepSeek API Key。
- 不允许 AI 直接触发设备控制。
- 不新增完整审批流。
- 不修改公开追溯页。

## 4. DeepSeek 边界

服务端请求使用 OpenAI-compatible Chat Completions：

```text
POST https://api.deepseek.com/chat/completions
Authorization: Bearer ${DEEPSEEK_API_KEY}
```

默认请求使用非流式响应，`thinking` 设为 `disabled`。建议草稿只保存摘要，不保存完整 prompt。

## 5. D1 表

新增 `heos_ai_review_actions`：

- `id`
- `trace_id`
- `tenant_id`
- `user_id`
- `interaction_id`
- `action`
- `status_after_action`
- `note`
- `created_at`

## 6. 验收命令

```bash
pnpm exec vitest run src/domain/ai/deepseek-provider.test.ts src/domain/ai/review.test.ts src/domain/ai/review-api.test.ts src/domain/ai/review-d1-repository.test.ts src/domain/ai/api.test.ts
pnpm test
pnpm run build
git diff --check
```
