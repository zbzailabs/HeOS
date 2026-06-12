# S4-18 追溯 JSON 导出控制台入口

## 1. 背景

S4-17 已完成 `POST /api/core/trace-exports`，实现公开追溯档案 JSON 文件写入 R2、D1 对象引用回填和 `trace.export` 审计记录。当前 `/console` 追溯档案区仍只展示公开档案，缺少直接触发 JSON 导出的后台操作入口。

## 2. 范围

- 为追溯档案工作台数据增加导出动作配置。
- `/console` 追溯档案列表每条公开档案展示 JSON 导出按钮。
- 按钮调用 `POST /api/core/trace-exports`。
- 请求 body 包含 `tenantId`、`publicSlug`、`format=json`。
- 成功后展示 R2 `objectRef`。
- 失败后展示错误信息，不刷新页面。

## 3. 不做范围

- 不生成 PDF、DOCX、XLSX 文件。
- 不新增独立追溯导出页面。
- 不修改 S4-17 API 写入逻辑。
- 不提交密钥。

## 4. 数据契约

`traceArchives.exportAction`：

```json
{
  "apiPath": "/api/core/trace-exports",
  "format": "json",
  "permissionCode": "trace:archive:export",
  "auditAction": "trace.export",
  "label": "导出 JSON"
}
```

## 5. 验收标准

- `traceArchives.exportAction` 包含 API 路径、格式、权限码、审计动作和按钮标签。
- `/console` 每条公开追溯档案都有“导出 JSON”按钮。
- 点击按钮时展示处理中状态，重复点击不会发送并发请求。
- 成功响应展示 R2 `objectRef`。
- 非 200 响应或网络异常展示错误提示。
- 页面不使用 `window.location.reload()`。

## 6. 验证命令

```bash
pnpm exec vitest run src/domain/console/workbench.test.ts
pnpm test
pnpm run build
git diff --check
```
