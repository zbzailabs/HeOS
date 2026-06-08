# TanStack CLI 工作流

本项目使用 TanStack Start、React、TanStack Router、Vite、Tailwind CSS、Prisma、Neon 和 Cloudflare Workers。新功能开发采用 Spec-Driven Development：先写清功能规格、验收标准和边界，再使用 TanStack CLI 检查集成方案并做小范围修改。

## 已验证的 CLI 入口

通过 `pnpm dlx` 运行 CLI，保证命令明确、结果可检查：

```bash
pnpm dlx @tanstack/cli --help
pnpm dlx @tanstack/cli create --list-add-ons --framework React --json
pnpm dlx @tanstack/cli create --addon-details better-auth --framework React --json
pnpm dlx @tanstack/cli search-docs "server functions" --library start --framework react --json
pnpm dlx @tanstack/cli doc start framework/react/guide/authentication --json
pnpm dlx @tanstack/cli ecosystem --category auth --json
```

面向 agent 和 CI 的流程使用 `--json`。JSON 输出稳定，便于在文件变更前审阅。

## 脚手架同类 Start 应用

创建一个与本项目技术组合接近的新 TanStack Start 应用：

```bash
pnpm dlx @tanstack/cli create heos-next \
  --framework React \
  --add-ons better-auth,neon,prisma,shadcn,cloudflare
```

复制任何文件到本仓库前，先检查生成结果差异：

```bash
diff -ru heos-next/src /Users/a66/HeOS/src
diff -u heos-next/package.json /Users/a66/HeOS/package.json
```

修改当前项目时，优先查看 add-on 明细：

```bash
pnpm dlx @tanstack/cli create --addon-details better-auth --framework React --json
pnpm dlx @tanstack/cli create --addon-details prisma --framework React --json
pnpm dlx @tanstack/cli create --addon-details neon --framework React --json
pnpm dlx @tanstack/cli create --addon-details shadcn --framework React --json
pnpm dlx @tanstack/cli create --addon-details cloudflare --framework React --json
```

检查结果符合规格后，再执行集成：

```bash
pnpm dlx @tanstack/cli add better-auth neon prisma shadcn cloudflare --no-intent
```

差异较大时，每次只添加一个 add-on：

```bash
pnpm dlx @tanstack/cli add better-auth --no-intent
git diff -- src package.json pnpm-lock.yaml
```

## Builder

需要通过可视化方式选择技术组合时，使用 TanStack CLI 页面中的 Builder：

1. 打开 <https://tanstack.com/cli>。
2. 选择 TanStack Start、React、file router 和所需 add-ons。
3. 导出或复制生成配置。
4. 将生成文件与本仓库对比后再应用变更。

Builder 适合初始技术组合选择。可重复的本地变更以 CLI JSON 命令为准。

## MCP Server 状态

旧的 `tanstack mcp` 命令已经从 CLI 中移除。当前官方建议使用直接 CLI 命令完成 agent 检索和自动化。

替代关系如下：

| 旧 MCP 工具 | 当前 CLI 命令 |
| --- | --- |
| `listTanStackAddOns` | `tanstack create --list-add-ons --framework React --json` |
| `getAddOnDetails` | `tanstack create --addon-details drizzle --framework React --json` |
| `createTanStackApplication` | `tanstack create my-app --framework React --add-ons drizzle,clerk` |
| `tanstack_doc` | `tanstack doc start framework/react/overview --json` |
| `tanstack_search_docs` | `tanstack search-docs "server functions" --library start --json` |
| `tanstack_ecosystem` | `tanstack ecosystem --category database --json` |

CLI 仍提供应用级 `mcp` add-on，用于让项目托管自己的 MCP endpoint：

```bash
pnpm dlx @tanstack/cli create --addon-details mcp --framework React --json
pnpm dlx @tanstack/cli add mcp --no-intent
```

该 add-on 的警告信息表明：实现仍在开发中，且不支持认证。把它作为明确的功能规格决策处理，不作为默认项目设置。

## 认证集成

TanStack Start 认证文档强调 server functions、HTTP-only cookie sessions，以及通过 `beforeLoad` 做路由级访问控制。返回或修改私有数据的 server routes 和 server functions 仍在服务端函数或服务端路由内部完成授权校验。

CLI 当前可发现的认证 add-ons 包括：

- `better-auth`：自托管用户账号和 session。
- `clerk`：托管用户账号，带预置登录 UI。
- `workos`：企业 SSO、SAML 和目录同步。

本仓库在规格要求自托管认证时使用 `better-auth`：

```bash
pnpm dlx @tanstack/cli create --addon-details better-auth --framework React --json
pnpm dlx @tanstack/cli add better-auth --no-intent
```

CLI 明细显示 Better Auth 预期改动文件包括：

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/routes/api/auth/$.ts`
- `src/routes/demo/better-auth.tsx`
- `src/integrations/better-auth/header-user.tsx`
- `.env.local` 中新增 `BETTER_AUTH_SECRET`

添加认证后检查：

```bash
git diff -- src package.json pnpm-lock.yaml .env.example
pnpm run test
pnpm run build
```

## 数据库与 ORM 集成

TanStack Start 数据库文档说明：数据库访问通过 server functions 或 server routes 调用数据库 adapter、client、driver 或 service。官方推荐数据库提供方包括 Neon 和 Convex。本项目已经使用 Neon serverless Postgres 与 Prisma。

当前数据库命令：

```bash
pnpm run db:generate
pnpm run db:push
pnpm run db:migrate
pnpm run db:studio
```

当前 server function 示例位于：

- `src/routes/demo/prisma.tsx`
- `src/routes/demo/neon.tsx`
- `src/db.ts`

新增数据功能时，在 `prisma/schema.prisma` 中修改 schema，生成 Prisma client，再通过 server function 调用 Prisma 或 Neon。数据库代码保持服务端执行。

## 样式集成

CLI 将 `shadcn` 列为 styling add-on。本项目已经使用 Tailwind CSS 4，并在 `src/styles.css` 中维护设计 token。

添加前先检查：

```bash
pnpm dlx @tanstack/cli create --addon-details shadcn --framework React --json
```

应用后保持组件与现有 token 一致。除非规格明确要求重做视觉体系，否则不替换整套样式系统。

## 部署集成

TanStack Start hosting 文档列出 Cloudflare Workers、Netlify、Railway、Nitro、Vercel、Node.js、Bun 和 Appwrite Sites。本仓库已经配置 Cloudflare Workers：

- `package.json` 中包含 `@cloudflare/vite-plugin`
- `vite.config.ts` 中配置 Cloudflare plugin
- `wrangler.jsonc`
- `pnpm run deploy`

验证 Cloudflare 相关变更：

```bash
pnpm run build
pnpm dlx wrangler whoami
pnpm run deploy
```

生产环境密钥通过 `wrangler secret put NAME` 写入。本地密钥保存在 `.env.local`。

## 包级最佳实践

- TanStack Router：在 `src/routes` 中创建 file routes，依赖生成的路由类型，使用 `beforeLoad` 处理路由级认证体验。
- TanStack Start：使用 `createServerFn` 执行服务端操作；敏感读写在 server function 或 server route 内完成授权校验。
- Prisma：`PrismaClient` 只在服务端使用，schema 变更后重新生成 client。
- Neon：本地 `DATABASE_URL` 保存在 `.env.local`，生产环境通过部署平台密钥配置。
- Tailwind CSS：优先扩展 `src/styles.css` 中的 token 和工具类，再增加组件级样式。
- Cloudflare Workers：关注 Worker runtime 兼容性，通过 Wrangler 验证构建和部署。

## 文档来源

- TanStack CLI：<https://tanstack.com/cli>
- CLI MCP migration：<https://tanstack.com/cli/latest/docs/mcp-migration>
- Start authentication：<https://tanstack.com/start/latest/docs/framework/react/guide/authentication>
- Start databases：<https://tanstack.com/start/latest/docs/framework/react/guide/databases>
- Start hosting：<https://tanstack.com/start/latest/docs/framework/react/guide/hosting>
