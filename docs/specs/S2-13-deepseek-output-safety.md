# S2-13 DeepSeek 输出质量与安全边界

关联 Issue：[#59](https://github.com/zbzailabs/HeOS/issues/59)

## 1. 目标

DeepSeek 生成的 draft 建议进入人工确认队列前，服务端先执行安全校验，防止直接设备控制、阈值修改和自动执行类表述进入业务链路。

## 2. 适用范围

- `/api/core/ai-interactions` 的 `mode=draft` 分支。
- `createDeepSeekDraftProvider()` 返回的 `choices[0].message.content`。
- 后续 AI 场景复用同一输出校验函数。

## 3. 输出规则

- 去除首尾空白。
- 输出为空时返回 `AI_OUTPUT_EMPTY`。
- 包含以下直接控制短语时返回 `AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN`：
  - `打开水泵`
  - `关闭水泵`
  - `下发控制`
  - `修改控制阈值`
  - `修改阈值`
  - `自动执行`
- 最大输出长度为 160 个字符，且不超过 240 字节。
- 截断在服务端完成，避免后台展示过长文本。

## 4. API 行为

DeepSeek 返回不安全内容时，provider 返回：

```json
{
  "ok": false,
  "status": 400,
  "errors": [
    {
      "code": "AI_OUTPUT_DEVICE_CONTROL_FORBIDDEN"
    }
  ]
}
```

`/api/core/ai-interactions` 直接透传该 400 结果，不创建 AI 交互记录，不写入人工确认队列。

## 5. 验证命令

```bash
pnpm exec vitest run src/domain/ai/deepseek-safety.test.ts src/domain/ai/deepseek-provider.test.ts src/domain/ai/api.test.ts
```
