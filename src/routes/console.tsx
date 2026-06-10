import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  LayoutDashboard,
  Lock,
  Map,
  Menu,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react'
import {
  getConsoleModuleAccess,
  getConsoleShellMetrics,
  type ConsoleModule,
} from '../domain/rbac/console-shell'
import {
  getCurrentAccessContext,
  getCurrentAccessSummary,
  getCurrentConsoleMenu,
} from '../lib/access'
import { signOut } from '../lib/auth'

const iconMap = {
  activity: Activity,
  'key-round': Lock,
  'layout-dashboard': LayoutDashboard,
  map: Map,
  settings: Settings,
  'shield-check': ShieldCheck,
  users: Users,
} as const

export const Route = createFileRoute('/console')({
  loader: async () => {
    const [accessContext, accessSummary, menuItems] = await Promise.all([
      getCurrentAccessContext(),
      getCurrentAccessSummary(),
      getCurrentConsoleMenu(),
    ])

    return {
      accessContext,
      accessSummary,
      menuItems,
      moduleAccess: getConsoleModuleAccess(accessContext),
      shellMetrics: getConsoleShellMetrics(accessContext, menuItems),
    }
  },
  component: ConsolePage,
})

function ConsolePage() {
  const {
    accessContext,
    accessSummary,
    menuItems,
    moduleAccess,
    shellMetrics,
  } = Route.useLoaderData()
  const currentUser = accessContext?.user

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#edf6ef] text-[#12383c]">
      <div className="grid min-h-screen min-w-0 max-w-full overflow-x-hidden lg:grid-cols-[280px_1fr]">
        <aside className="min-w-0 max-w-full overflow-hidden border-b border-[#d7e6db] bg-[#12383c] px-4 py-4 text-white lg:border-b-0 lg:border-r lg:border-[#0c2b2f] lg:px-5 lg:py-6">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:block">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-white no-underline"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#61d0b4] text-[#12383c]">
                <Sprout size={20} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-base font-extrabold">HeOS</span>
                <span className="block text-xs font-semibold text-[#a9cfc2]">
                  Console
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/8 text-white lg:hidden"
              aria-label="打开导航"
            >
              <Menu size={19} />
            </button>
          </div>

          <nav className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1 lg:mt-8 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {menuItems.map((menuItem) => {
              const Icon =
                iconMap[menuItem.icon as keyof typeof iconMap] ?? ChevronRight
              return (
                <Link
                  key={menuItem.id}
                  to="/console"
                  className="inline-flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#dceee7] no-underline transition hover:bg-white/10 hover:text-white lg:flex lg:min-w-0"
                  activeProps={{ className: 'bg-white/12 text-white' }}
                >
                  <Icon size={17} strokeWidth={2.3} />
                  {menuItem.title}
                </Link>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 border-b border-[#d7e6db] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#3c7a62]">
                HeOS Console
              </p>
              <h1 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-[#12383c] sm:text-3xl">
                后台管理工作台
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#c8ddd0] bg-white px-3 py-2 text-sm font-bold text-[#345c58]">
                {currentUser?.email ?? '未登录'}
              </span>
              <button
                type="button"
                className="rounded-lg border border-[#c8ddd0] bg-white px-3 py-2 text-sm font-bold text-[#12383c] transition hover:bg-[#f7fbf8]"
                onClick={handleSignOut}
              >
                退出
              </button>
            </div>
          </header>

          <section className="grid gap-3 py-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="数据范围"
              value={accessSummary.dataScope ?? 'none'}
              icon={<ShieldCheck size={18} />}
            />
            <MetricCard
              label="角色"
              value={accessSummary.roleIds.join(', ') || 'none'}
              icon={<Users size={18} />}
            />
            <MetricCard
              label="权限数量"
              value={String(accessSummary.permissionCount)}
              icon={<Lock size={18} />}
            />
            <MetricCard
              label="可见菜单"
              value={`${shellMetrics.menuCount}/${shellMetrics.configuredMenuCount}`}
              icon={<LayoutDashboard size={18} />}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
                    模块入口
                  </h2>
                  <p className="m-0 mt-1 text-sm leading-6 text-[#5b736d]">
                    模块入口按服务端权限结果显示状态，后续页面在此壳层下扩展。
                  </p>
                </div>
                <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
                  {shellMetrics.allowedModuleCount}/{shellMetrics.moduleCount}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {moduleAccess.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#d7e6db] bg-[#12383c] p-4 text-white shadow-[0_18px_44px_rgba(18,56,60,0.14)] sm:p-5">
              <div className="flex items-center gap-2">
                <Database size={19} />
                <h2 className="m-0 text-lg font-extrabold">实施状态</h2>
              </div>
              <ol className="mt-5 space-y-4 pl-0">
                <StatusStep
                  title="权限模型"
                  text="S1-04 已完成 D1 表结构、权限码、数据范围和菜单定义。"
                  done
                />
                <StatusStep
                  title="服务端权限"
                  text="S2-04 已完成访问上下文、权限判断和菜单过滤函数。"
                  done
                />
                <StatusStep
                  title="后台壳层"
                  text="S3-03 将 /console 接入服务端菜单，形成后台入口。"
                  done
                />
                <StatusStep
                  title="业务页面"
                  text="租户权限、资产、监测告警和系统管理页面继续按 Issue 推进。"
                />
              </ol>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_10px_24px_rgba(18,56,60,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#5b736d]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f5ef] text-[#2d7359]">
          {icon}
        </span>
      </div>
      <p className="m-0 mt-3 truncate text-lg font-extrabold text-[#12383c]">
        {value}
      </p>
    </div>
  )
}

function ModuleCard({
  module,
}: {
  module: ConsoleModule & { allowed: boolean }
}) {
  return (
    <article className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-extrabold text-[#12383c]">
            {module.title}
          </h3>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            {module.description}
          </p>
        </div>
        {module.allowed ? (
          <CheckCircle2 className="shrink-0 text-[#2d7359]" size={20} />
        ) : (
          <Lock className="shrink-0 text-[#8aa29b]" size={20} />
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#456b64]">
          {module.metric}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#2d7359]">
          {module.allowed ? '已授权' : '未授权'}
          <ChevronRight size={14} />
        </span>
      </div>
    </article>
  )
}

function StatusStep({
  title,
  text,
  done = false,
}: {
  title: string
  text: string
  done?: boolean
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[#9de0c3]">
        {done ? <CheckCircle2 size={17} /> : <BarChart3 size={17} />}
      </span>
      <span>
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[#b9d7cc]">
          {text}
        </span>
      </span>
    </li>
  )
}
