# HeOS

HeOS 是基于 TanStack Start 初始化的 Web 应用项目。当前技术栈包括 TanStack Start、TanStack Router、React 19、Vite、Tailwind CSS、Prisma、Neon serverless Postgres、Cloudflare Workers、Vitest 和 pnpm。

新功能开发采用 Spec-Driven Development：先明确规格、验收标准和边界，再编写代码。

## 环境要求

- Node.js
- pnpm
- Git
- 本地敏感配置文件：`.env.local`
- 环境变量示例文件：`.env.example`

本机 Node.js 项目优先使用 pnpm。

## 安装依赖

```bash
pnpm install
```

## 本地开发

```bash
pnpm dev
```

默认开发端口为 `3000`。

## 生产构建

```bash
pnpm build
```

## 预览构建产物

```bash
pnpm preview
```

## 测试

项目使用 [Vitest](https://vitest.dev/)。

```bash
pnpm test
```

当前测试脚本带 `--passWithNoTests`，没有测试文件时命令仍返回成功。

## 数据库

项目使用 Prisma 与 Neon serverless Postgres。

常用命令：

```bash
pnpm run db:generate
pnpm run db:push
pnpm run db:migrate
pnpm run db:studio
pnpm run db:seed
```

数据库连接字符串保存在 `.env.local` 的 `DATABASE_URL` 中。生产环境密钥通过部署平台配置。

相关文件：

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/db.ts`
- `src/routes/demo/prisma.tsx`
- `src/routes/demo/neon.tsx`

## 路由

项目使用 [TanStack Router](https://tanstack.com/router) 的 file-based routing。路由文件位于 `src/routes`。

新增页面时，在 `src/routes` 中创建路由文件。TanStack Router 会生成路由类型文件。

示例：

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/example')({
  component: ExamplePage,
})

function ExamplePage() {
  return <main>Example</main>
}
```

## 页面跳转

项目内 SPA 跳转使用 `@tanstack/react-router` 的 `Link` 组件。

```tsx
import { Link } from '@tanstack/react-router'

export function NavLink() {
  return <Link to="/about">关于</Link>
}
```

## 根布局

根布局位于 `src/routes/__root.tsx`。全局 HTML、`HeadContent`、`Scripts`、全局组件和路由出口在该文件中组织。

## Server Functions

TanStack Start 使用 `createServerFn` 编写服务端函数。敏感数据读取和写入在服务端函数内部完成授权校验。

示例：

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})
```

## API Routes

可以在 route definition 中通过 `server.handlers` 创建 API routes。

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## 数据加载

路由数据可以通过 TanStack Router 的 `loader` 加载，并在组件中通过 `Route.useLoaderData()` 读取。

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeoplePage,
})

function PeoplePage() {
  const data = Route.useLoaderData()

  return (
    <ul>
      {data.results.map((person: { name: string }) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

## 样式

项目使用 [Tailwind CSS](https://tailwindcss.com/) 4。

样式入口：

- `src/styles.css`

设计 token 和全局样式集中维护在 `src/styles.css`。新增组件样式优先复用现有 token。

## TanStack CLI 工作流

项目内 TanStack CLI 工作流记录在：

- `docs/tanstack-cli-workflow.md`

常用命令：

```bash
pnpm dlx @tanstack/cli --help
pnpm dlx @tanstack/cli create --list-add-ons --framework React --json
pnpm dlx @tanstack/cli search-docs "server functions" --library start --framework react --json
```

## 部署

项目已配置 Cloudflare Workers / Wrangler。

相关文件：

- `vite.config.ts`
- `wrangler.jsonc`
- `package.json`

部署命令：

```bash
pnpm run deploy
```

部署前先完成构建验证：

```bash
pnpm run build
```

生产环境密钥通过 Wrangler 配置：

```bash
pnpm dlx wrangler secret put NAME
```

## Demo 文件

`src/routes/demo/` 下的文件用于展示 Prisma 和 Neon 集成。正式功能开发时，可以按规格保留、修改或删除这些 demo 路由。

## 项目约束

- 使用 pnpm 管理依赖。
- 提交 `pnpm-lock.yaml`。
- `.env.local` 不提交到 GitHub。
- `.env.example` 保存环境变量示例。
- 修改代码前读取 `AGENTS.md` 和 `DESIGN.md`。
- 新功能开发采用 Spec-Driven Development。

## 参考文档

- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [TanStack CLI](https://tanstack.com/cli)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Neon](https://neon.tech/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
