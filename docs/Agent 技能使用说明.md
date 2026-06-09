# mattpocock/skills 在 HeOS 开发中的使用说明

`mattpocock/skills` 用于把需求、缺陷、设计与实现动作统一到同一工作流。HeOS 使用该能力的边界如下。

## 一、先决条件

- 运行环境使用 `pnpm`、`Node.js`。
- 开发遵循 Spec-Driven Development。
- 保证 `AGENTS.md` 与 `DESIGN.md` 可读且最新。
- 已有 `docs` 目录可写。

## 二、首次接入

执行：

```bash
/setup-matt-pocock-skills
```

该流程会完成以下内容：

- 识别 HeOS 的 issue 归档方式。
- 写入并校准 triage 标签映射。
- 写入域上下文规则。
- 在 `AGENTS.md` 写入 `## Agent skills`。

生成/更新路径：

- `docs/agents/Issue任务管理.md`
- `docs/agents/分流标签.md`
- `docs/agents/领域上下文.md`
- `AGENTS.md`

## 三、核心技能清单与使用时机

### `/to-issues`
- 输入：需求点、用户反馈、线上问题。
- 输出：结构化 issue（范围、背景、验收条件）。
- 触发场景：启动一个新任务前。

### `/triage`
- 输入：已创建 issue。
- 输出：五类状态与标签闭环。
- 触发场景：开发前先确认问题边界是否完整。

### `/to-prd`
- 输入：已 triage 的 issue。
- 输出：PRD 文档（范围、优先级、验收清单、异常场景）。
- 触发场景：中等以上改动需固定需求边界时。

### `/diagnose`
- 输入：故障现象、重现路径、日志。
- 输出：根因假设与排查路径。
- 触发场景：鉴权、路由、数据库、异步任务异常。

### `/tdd`
- 输入：验收标准、输入输出边界。
- 输出：测试优先实现顺序。
- 触发场景：复杂业务逻辑与多分支处理。

### `/improve-codebase-architecture`
- 输入：反复变更的模块、重复实现、耦合风险。
- 输出：架构优化建议与分阶段落地清单。
- 触发场景：重构前先行评估。

### `/zoom-out`
- 输入：功能模块或改动范围。
- 输出：影响面、风险、依赖和补充文档。
- 触发场景：跨路由、跨存储、跨运行时改动。

## 四、HeOS 标准执行流程

1. 新需求：`/to-issues`
2. 任务整理：`/triage`
3. 需要规格沉淀：`/to-prd`
4. 按 spec 进入实现：`/tdd`
5. 遇到异常：`/diagnose`
6. 变更较大：`/improve-codebase-architecture`
7. 合并前复核：`/zoom-out`

## 五、与 HeOS 技术栈的结合

- 认证与路由改动按 `/diagnose` -> `/tdd` 顺序执行，杜绝一次性改完再测。
- 数据模型与持久层改动先产出 PRD，再执行测试和迁移预演。
- Cloudflare 运行时相关改动纳入 `/zoom-out` 的影响面清单。
- 每次改动提交前执行项目既定构建链路与代码规范。

## 六、故障与修复

- 若技能找不到仓库上下文，先执行 `/setup-matt-pocock-skills`。
- 若 triage 标签不一致，先修正 `docs/agents/分流标签.md`。
- 若技能输出不落地，回到 `AGENTS.md` 与 `DESIGN.md` 检查约束后重跑。
