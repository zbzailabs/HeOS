# Issue tracker: GitHub

HeOS 的 issue 与 PRD 在 GitHub 仓库 `zbzailabs/HeOS` 下维护。

- 仓库：`zbzailabs/HeOS`
- 默认管理路径：GitHub Issues
- 关联项目管理：<https://github.com/users/zbzailabs/projects/2>

## 使用约定

- 创建 issue：`gh issue create --title "..." --body "..."`
- 查询 issue：`gh issue list --state open`
- 查看详情：`gh issue view <number> --comments`
- 查看评论：`gh issue view <number> --comments`
- 打标签：`gh issue edit <number> --add-label "<label>"`

使用 `gh` 时，优先在仓库根目录执行（自动继承 `git remote`）。
