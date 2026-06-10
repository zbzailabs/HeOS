# S3-07 生产默认入口切换

关联 Issue：[#44](https://github.com/zbzailabs/HeOS/issues/44)

## 1. 背景

`app.yunhe.ai/` 根路径长期展示最初 demo 页面，用户无法从默认入口看到一期后台能力。现有一期后台入口位于 `/console`，已接入登录保护、权限菜单、D1 查询和主业务页面区块。

## 2. 范围

本任务交付以下内容：

- 根路径 `/` 重定向到 `/console`。
- 已登录用户访问 `/` 后进入后台管理工作台。
- 未登录用户访问 `/` 后继续进入现有登录保护链路。
- 回归测试覆盖有效会话访问 `/` 的路由结果。

本任务不交付以下内容：

- 完整业务 CRUD。
- 真实告警生成。
- 真实遥测数据补齐。
- 农事任务流转写入。
- 追溯详情页。
- AI 辅助操作闭环。

## 3. 验收

- `pnpm exec playwright test tests/e2e/console-smoke.spec.ts -g "routes authenticated root visits" --project=chromium-desktop`
- `pnpm test`
- `pnpm run build`
- 部署后 `app.yunhe.ai/` 默认不再展示 demo 首页。
