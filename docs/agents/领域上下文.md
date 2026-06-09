# Domain Docs

## Before exploring, read these

- `CONTEXT.md`（若不存在则跳过）
- `CONTEXT-MAP.md`（若存在则按它指向读取）
- `docs/adr/`（若不存在则跳过）

## File structure

Single-context repo（HeOS 当前视图）：

- 仓库根目录
  - `CONTEXT.md`
  - `docs/adr/`
  - `src/`

Multi-context repo（不存在时不必处理）：

- `CONTEXT-MAP.md`
- `docs/adr/`
- `src/<context>/CONTEXT.md`
- `src/<context>/docs/adr/`

## Language use

当输出涉及领域概念时，优先使用仓库当前文档中出现的术语。
