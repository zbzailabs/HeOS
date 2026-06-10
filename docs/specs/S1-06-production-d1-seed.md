# S1-06 生产 D1 租户项目与种子数据

## 1. 范围

本规格覆盖腾龙小学智慧农场生产基础数据初始化：

- 租户、组织、岗位、用户。
- 项目、基地、地块、大棚。
- Renke 供应商账号引用和设备 `40406816`。
- 作物模型、作物阶段、作物周期。
- 农事任务、公开追溯档案、AI 辅助记录、同步记录。

## 2. 实现

- seed 文件：`db/seeds/0001_tenglong_smart_farm.sql`
- 执行命令：`pnpm run d1:seed:tenglong`
- seed 记录使用稳定主键和 `ON CONFLICT` 更新，允许重复执行。
- Renke 凭据只保存 secret 引用：`RENKE_LOGIN_PASSWORD`、`RENKE_TOKEN`，不保存明文账号密码或 token。

## 3. 验收

- `pnpm exec vitest run src/domain/core/seed.test.ts`
- `pnpm run d1:seed:tenglong`
- `pnpm exec wrangler d1 execute heos --remote --command "SELECT COUNT(*) AS count FROM heos_projects WHERE tenant_id='tenant-tenglong-school';"`
- 生产 D1 查询返回项目、设备、农事任务和公开追溯记录。

