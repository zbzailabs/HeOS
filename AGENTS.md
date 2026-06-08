# AGENTS.md instructions for /Users/a66/HeOS

项目新任务开始先读取飞书项目对应项目管理内容，每次任务结束，在飞书项目中记录工作内容。
初始化项目时添加 [AGENTS.md](https://github.com/agentsmd/agents.md) 、DESIGN.md。
开发项目时，先读取 AGENTS.md 和 DESIGN.md；如果没有这两个文件，则补全。

这台 Mac mini 的开发环境信息：M 芯片 Mac Mini，16G 内存，512G 硬盘；已安装 Homebrew；已经 `brew install node pnpm git gh python mole pandoc jq wget zsh curl httpie codex libreoffice`；我们的 GitHub 账号是 <https://github.com/zbzailabs>，GitHub 已经添加到 github，本地密钥 `.ssh/id_ed25519`，使用 SSH 连接 GitHub，可使用 `gh` 管理代码；Node.js 开发优先使用 pnpm。本机位于中国杭州，配置了 Clash Verge 和 VPN，以方便访问 GitHub、Google、TG 等外网。Clash 已开启 TUN 模式。

本机已配置 spec-kit。用户要求开发项目、编写代码时，提醒并引导用户采用 Spec-Driven Development。

云服务器情况：位置：中国上海，IP：150.158.22.159，Ubuntu 24.04，CPU：4 核，内存：8GB，系统盘：SSD 云硬盘 180GB，操作系统：Ubuntu Server 24.04 LTS 64bit，已安装 dokploy，已配置 VPN，可访问 Google、GitHub 等外网。

禁止使用中国互联网大厂黑话如“落盘”、“拉通”、“对齐”。不要使用“不是....而是”，直截了当，简洁明了撰写。

编写 .docx 格式文档时，行文格式严格按照 GB/T 9704-2012 执行，写作风格符合中国政府公文风格。按 GB/T 9704-2012 风格设置：A4 页面，正式公文版式，正文以仿宋类字体为主，标题和层级标题按公文层级字体处理。正文使用专业、克制、可提交业主的表述；避免营销腔、口号化、内部判断语和中国互联网公司黑话。表格仅用于预算、建设内容、实施计划和验收指标，避免把普通说明文字做成大段表格。生成后使用 Documents 工作流渲染为页面图片，逐页检查标题、表格、页边距、分页、字体和预算表合计。不要使用“应该”，“应”，“可……”这种弱化语气，作为方案方提供的方案，要采用坚定、确切的表述。

## Agent skills

### Issue tracker

HeOS 使用 GitHub Issues 作为任务载体，仓库为 `zbzailabs/HeOS`，并同步至项目管理页 https://github.com/users/zbzailabs/projects/2。See `docs/agents/issue-tracker.md`.

### Triage labels

Triage 以默认五类标签运行：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

采用单一上下文结构，优先读取 `CONTEXT.md` 与 `docs/adr/`（若不存在则按现状静默跳过）。See `docs/agents/domain.md`.
