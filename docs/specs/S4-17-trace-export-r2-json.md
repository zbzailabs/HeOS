# S4-17 追溯导出 JSON 文件写入 R2

## 1. 背景

HeOS 一期已具备追溯公开页、D1 追溯档案查询、R2 object key 规划和 `trace.export` 审计动作。当前缺口是导出文件仍停留在计划边界，尚未形成真实文件生成、R2 上传、对象引用回填和审计写入链路。

本阶段先交付 JSON 导出。JSON 具备稳定结构、可直接校验内容和对象元数据，作为后续 PDF、DOCX、XLSX 导出的服务端基础。

## 2. 范围

- `POST /api/core/trace-exports` 接收 `tenantId`、`publicSlug`、`format`。
- `format` 本阶段仅允许 `json` 进入真实导出。
- API 从 D1 读取公开追溯档案、项目、作物周期和农事记录。
- API 生成 JSON payload，写入 `HEOS_EXPORTS` R2。
- API 回填 `heos_trace_archives.exported_asset_refs_json`。
- API 写入 `heos_audit_logs`，动作为 `trace.export`。

## 3. 不做范围

- 不生成 PDF、DOCX、XLSX 文件。
- 不新增前端按钮。
- 不修改 Renke 同步逻辑。
- 不提交密钥。

## 4. 请求与响应

请求：

```json
{
  "tenantId": "tenant-tenglong-school",
  "publicSlug": "tlxx-lettuce-2026-summer",
  "format": "json"
}
```

成功响应：

```json
{
  "traceId": "trace-export_xxx",
  "data": {
    "traceArchiveId": "trace-tenglong-lettuce-2026-summer",
    "format": "json",
    "objectKey": "tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/json/trace-tenglong-lettuce-2026-summer-20260612T000000000Z.json",
    "objectRef": "r2://heos-exports/tenant-tenglong-school/trace/tlxx-lettuce-2026-summer/json/trace-tenglong-lettuce-2026-summer-20260612T000000000Z.json",
    "contentType": "application/json; charset=utf-8",
    "generatedAt": "2026-06-12T00:00:00.000Z",
    "auditAction": "trace.export"
  }
}
```

## 5. 验收标准

- JSON 导出包含 trace archive 基础信息、项目、作物周期、公开 payload、农事记录和导出元数据。
- R2 写入使用 `HEOS_EXPORTS`、`content-type: application/json; charset=utf-8` 和稳定 object key。
- D1 回填追加导出对象引用，包含 `format`、`objectKey`、`objectRef`、`contentType`、`generatedAt`。
- 审计日志写入 `trace.export`，包含 traceId、tenantId、userId、目标 trace archive 和成功结果。
- 无 D1 或 R2 绑定时返回结构化 503 错误。
- 无对应公开追溯档案时返回结构化 404 错误。

## 6. 验证命令

```bash
pnpm exec vitest run src/domain/trace/export-plan.test.ts
pnpm test
pnpm run build
git diff --check
```
