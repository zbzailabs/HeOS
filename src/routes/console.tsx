import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CloudCog,
  Cpu,
  Database,
  Download,
  FileCheck2,
  Gauge,
  History,
  Leaf,
  LayoutDashboard,
  ListChecks,
  ListTree,
  Lock,
  Map,
  MapPinned,
  Menu,
  RadioTower,
  RefreshCw,
  ScanEye,
  ServerCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Table2,
  Users,
  Warehouse,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { getConsoleDataWorkbench } from '../domain/console/workbench'
import {
  getConsoleMenuTree,
  getConsoleModuleAccess,
  getConsoleShellMetrics,
  type ConsoleModule,
  type ConsoleMenuTreeItem,
} from '../domain/rbac/console-shell'
import {
  getCurrentAccessContext,
  getCurrentAccessSummary,
  getCurrentConsoleMenu,
} from '../lib/access'
import { signOut } from '../lib/auth'
import { getCurrentConsoleDataWorkbench } from '../lib/console-data'

const iconMap = {
  activity: Activity,
  bell: Bell,
  'book-open': BookOpen,
  'check-circle-2': CheckCircle2,
  'cloud-cog': CloudCog,
  'file-check-2': FileCheck2,
  gauge: Gauge,
  history: History,
  'key-round': Lock,
  'layout-dashboard': LayoutDashboard,
  'list-checks': ListChecks,
  'list-tree': ListTree,
  map: Map,
  'map-pinned': MapPinned,
  'radio-tower': RadioTower,
  'refresh-cw': RefreshCw,
  'scan-eye': ScanEye,
  'server-cog': ServerCog,
  settings: Settings,
  'shield-check': ShieldCheck,
  'sliders-horizontal': SlidersHorizontal,
  users: Users,
  warehouse: Warehouse,
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
      menuTree: getConsoleMenuTree(menuItems),
      dataWorkbench: await getCurrentConsoleDataWorkbench(),
    }
  },
  component: ConsolePage,
})

function ConsolePage() {
  const {
    accessContext,
    accessSummary,
    menuItems,
    menuTree,
    moduleAccess,
    shellMetrics,
    dataWorkbench,
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

          <nav className="mt-5 grid max-h-[58vh] max-w-full gap-2 overflow-y-auto pr-1 lg:mt-8 lg:max-h-[calc(100vh-8rem)]">
            {menuTree.map((menuItem) => (
              <SidebarMenuGroup key={menuItem.id} item={menuItem} />
            ))}
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

          <section className="grid gap-3 py-5 sm:grid-cols-2 xl:grid-cols-7">
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
              value={`${shellMetrics.menuCount}+${shellMetrics.childMenuCount}/${shellMetrics.configuredMenuCount}`}
              icon={<LayoutDashboard size={18} />}
            />
            <MetricCard
              label="字典条目"
              value={String(dataWorkbench.dictionary.totalEntries)}
              icon={<BookOpen size={18} />}
            />
            <MetricCard
              label="遥测指标"
              value={String(dataWorkbench.telemetry.metricCount)}
              icon={<RadioTower size={18} />}
            />
            <MetricCard
              label="PRD 域"
              value={`${dataWorkbench.prdCoverage.domains.length}/${dataWorkbench.prdCoverage.tableCount}`}
              icon={<FileCheck2 size={18} />}
            />
          </section>

          <section className="grid gap-4 pb-5 xl:grid-cols-[1fr_1fr]">
            <DictionaryCoveragePanel dictionary={dataWorkbench.dictionary} />
            <TelemetryModelPanel telemetry={dataWorkbench.telemetry} />
          </section>

          <section className="grid gap-4 pb-5 xl:grid-cols-[1fr_1fr]">
            <RenkeDevicePanel
              renke={dataWorkbench.renke}
              deviceStatus={dataWorkbench.deviceStatus}
            />
            <CompliancePanel compliance={dataWorkbench.compliance} />
          </section>

          <section className="pb-5">
            <PrdCoveragePanel prdCoverage={dataWorkbench.prdCoverage} />
          </section>

          <section className="pb-5">
            <BusinessPagesPanel dataWorkbench={dataWorkbench} />
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
                  title="标准字典"
                  text={`${dataWorkbench.dictionary.categoryCount} 类 ${dataWorkbench.dictionary.totalEntries} 条码表已进入工作台首屏。`}
                  done
                />
                <StatusStep
                  title="遥测底座"
                  text={`${dataWorkbench.telemetry.latestTable} 与 ${dataWorkbench.telemetry.historyTable} 已完成模型展示。`}
                  done
                />
                <StatusStep
                  title="D1 数据库"
                  text={`${dataWorkbench.d1.binding} 绑定 ${dataWorkbench.d1.databaseName}，迁移目录 ${dataWorkbench.d1.migrationsDir}。`}
                  done
                />
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
                  text="项目资产、设备台账、作物模型、农事任务、告警中心、追溯档案和 AI 辅助记录已进入工作台。"
                  done
                />
              </ol>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

function BusinessPagesPanel({
  dataWorkbench,
}: {
  dataWorkbench: ReturnType<typeof getConsoleDataWorkbench>
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#2d7359]">
              <LayoutDashboard size={19} />
              <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
                主业务页面
              </h2>
            </div>
            <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
              入口连接到本页业务区块，数据来自 S2-05 服务端查询结果。
            </p>
          </div>
          <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
            {dataWorkbench.businessPages.length} pages
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dataWorkbench.businessPages.map((page) => (
            <a
              key={page.id}
              href={page.href}
              className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 text-[#12383c] no-underline transition hover:border-[#9bc8b6] hover:bg-white"
            >
              <span className="block text-sm font-extrabold">{page.title}</span>
              <span className="mt-2 block text-xs font-semibold leading-5 text-[#6c817b]">
                {page.description}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProjectAssetsPanel projectAssets={dataWorkbench.projectAssets} />
        <DeviceLedgerPanel deviceLedger={dataWorkbench.deviceLedger} />
        <CropModelsPanel cropModels={dataWorkbench.cropModels} />
        <AgriTasksPanel agriTasks={dataWorkbench.agriTasks} />
        <AlertCenterPanel alertCenter={dataWorkbench.alertCenter} />
        <TraceArchivesPanel traceArchives={dataWorkbench.traceArchives} />
      </div>

      <AiAssistantPanel aiAssistant={dataWorkbench.aiAssistant} />
    </div>
  )
}

function ProjectAssetsPanel({
  projectAssets,
}: {
  projectAssets: ReturnType<typeof getConsoleDataWorkbench>['projectAssets']
}) {
  return (
    <BusinessPanel
      id="project-assets"
      icon={<Map size={19} />}
      title="项目资产"
      badge={`${projectAssets.counts.sites} sites`}
    >
      {projectAssets.project ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3">
            <p className="m-0 text-base font-extrabold text-[#12383c]">
              {projectAssets.project.name}
            </p>
            <p className="m-0 mt-1 break-words text-xs font-semibold leading-5 text-[#6c817b]">
              {projectAssets.project.code} / {projectAssets.project.status}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MiniStat label="基地" value={String(projectAssets.counts.sites)} />
            <MiniStat label="地块" value={String(projectAssets.counts.plots)} />
            <MiniStat
              label="大棚"
              value={String(projectAssets.counts.greenhouses)}
            />
            <MiniStat label="设备" value={String(projectAssets.counts.devices)} />
          </div>
        </div>
      ) : (
        <EmptyState text="当前租户没有项目资产。" />
      )}
    </BusinessPanel>
  )
}

function DeviceLedgerPanel({
  deviceLedger,
}: {
  deviceLedger: ReturnType<typeof getConsoleDataWorkbench>['deviceLedger']
}) {
  return (
    <BusinessPanel
      id="device-ledger"
      icon={<Cpu size={19} />}
      title="设备台账"
      badge={`${deviceLedger.items.length}/${deviceLedger.total}`}
    >
      <FilterRow labels={['site: site-tenglong-smart-farm', 'limit: 1']} />
      <div className="mt-3 space-y-2">
        {deviceLedger.items.length > 0 ? (
          deviceLedger.items.map((device) => (
            <ListRow
              key={device.id}
              title={device.name}
              meta={`${device.externalDeviceId} / ${device.siteId}`}
              value={device.onlineStatus}
            />
          ))
        ) : (
          <EmptyState text="当前筛选条件没有设备。" />
        )}
      </div>
      <PaginationBar total={deviceLedger.total} nextCursor={deviceLedger.nextCursor} />
    </BusinessPanel>
  )
}

function CropModelsPanel({
  cropModels,
}: {
  cropModels: ReturnType<typeof getConsoleDataWorkbench>['cropModels']
}) {
  return (
    <BusinessPanel
      id="crop-models"
      icon={<Leaf size={19} />}
      title="作物模型"
      badge={`${cropModels.total} models`}
    >
      <div className="space-y-2">
        {cropModels.items.length > 0 ? (
          cropModels.items.map((model) => (
            <ListRow
              key={model.id}
              title={`${model.cropName} / ${model.cultivar}`}
              meta={`${model.cycleId} / ${model.stageCount} stages`}
              value={model.activeStage}
            />
          ))
        ) : (
          <EmptyState text="当前项目没有作物模型。" />
        )}
      </div>
      <p className="m-0 mt-3 rounded-lg bg-[#f8fcf9] px-3 py-2 text-xs font-semibold leading-5 text-[#6c817b]">
        {cropModels.emptyState}
      </p>
    </BusinessPanel>
  )
}

function AgriTasksPanel({
  agriTasks,
}: {
  agriTasks: ReturnType<typeof getConsoleDataWorkbench>['agriTasks']
}) {
  return (
    <BusinessPanel
      id="agri-tasks"
      icon={<ClipboardList size={19} />}
      title="农事任务"
      badge={`${agriTasks.items.length}/${agriTasks.total}`}
    >
      <FilterRow labels={['status: planned']} />
      <WorkflowStrip
        labels={agriTasks.workflow.steps.map((step) => step.label)}
        footer={`${agriTasks.workflow.permissionCode} / ${agriTasks.workflow.auditAction}`}
      />
      <div className="mt-3 space-y-2">
        {agriTasks.items.length > 0 ? (
          agriTasks.items.map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              meta={`${task.cropCycleId} / ${task.plannedStartAt ?? '未排期'}`}
              value={task.status}
            />
          ))
        ) : (
          <EmptyState text="当前筛选条件没有农事任务。" />
        )}
      </div>
      <PaginationBar total={agriTasks.total} nextCursor={agriTasks.nextCursor} />
    </BusinessPanel>
  )
}

function AlertCenterPanel({
  alertCenter,
}: {
  alertCenter: ReturnType<typeof getConsoleDataWorkbench>['alertCenter']
}) {
  return (
    <BusinessPanel
      id="alert-center"
      icon={<AlertTriangle size={19} />}
      title="告警中心"
      badge={`${alertCenter.items.length}/${alertCenter.total}`}
    >
      <FilterRow labels={['status: open']} />
      <WorkflowStrip
        labels={alertCenter.workflow.steps.map((step) => step.label)}
        footer={`${alertCenter.workflow.permissionCode} / ${alertCenter.workflow.auditAction}`}
      />
      <div className="mt-3 space-y-2">
        {alertCenter.items.length > 0 ? (
          alertCenter.items.map((alert) => (
            <ListRow
              key={alert.id}
              title={alert.reason}
              meta={`${alert.type} / ${alert.deviceId ?? 'no-device'}`}
              value={alert.level}
            />
          ))
        ) : (
          <EmptyState text="当前筛选条件没有开放告警。" />
        )}
      </div>
      <PaginationBar total={alertCenter.total} nextCursor={alertCenter.nextCursor} />
    </BusinessPanel>
  )
}

function TraceArchivesPanel({
  traceArchives,
}: {
  traceArchives: ReturnType<typeof getConsoleDataWorkbench>['traceArchives']
}) {
  return (
    <BusinessPanel
      id="trace-archives"
      icon={<History size={19} />}
      title="追溯档案"
      badge={`${traceArchives.items.length}/${traceArchives.total}`}
    >
      <FilterRow labels={['visibility: public']} />
      <FilterRow labels={traceArchives.publicFields.map((field) => `public: ${field}`)} />
      <div className="mt-3 space-y-2">
        {traceArchives.items.length > 0 ? (
          traceArchives.items.map((archive) => (
            <ListRow
              key={archive.id}
              title={archive.publicSlug}
              meta={`${archive.cropCycleId} / ${archive.createdAt}`}
              value={archive.visibility}
            />
          ))
        ) : (
          <EmptyState text="当前没有公开追溯档案。" />
        )}
      </div>
      <PaginationBar
        total={traceArchives.total}
        nextCursor={traceArchives.nextCursor}
      />
    </BusinessPanel>
  )
}

function AiAssistantPanel({
  aiAssistant,
}: {
  aiAssistant: ReturnType<typeof getConsoleDataWorkbench>['aiAssistant']
}) {
  const [reviewQueueItems, setReviewQueueItems] = useState(
    aiAssistant.reviewQueue.items,
  )
  const [reviewing, setReviewing] = useState<{
    id: string
    action: 'confirm' | 'reject'
  } | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const handleReview = async (interactionId: string, action: 'confirm' | 'reject') => {
    if (reviewing) {
      return
    }

    setReviewing({ id: interactionId, action })
    setReviewError(null)

    const response = await fetch('/api/core/ai-reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'tenant-tenglong-school',
        interactionId,
        action,
        note:
          action === 'confirm'
            ? '后台工作台人工确认。'
            : '后台工作台人工拒绝。',
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setReviewError(readReviewErrorMessage(body) ?? `人工确认请求失败：${response.status}`)
      setReviewing(null)
      return
    }

    setReviewQueueItems((items) =>
      items.filter((item) => item.id !== interactionId),
    )
    setReviewing(null)
  }

  return (
    <BusinessPanel
      id="ai-assistant"
      icon={<Bot size={19} />}
      title="AI 辅助记录"
      badge={`${reviewQueueItems.length} 待确认`}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 md:col-span-2">
          <p className="m-0 text-xs font-extrabold text-[#2d7359]">
            {aiAssistant.sourcePolicy.auditAction}
          </p>
          <p className="m-0 mt-1 text-xs font-semibold leading-5 text-[#6c817b]">
            仅引用授权数据：{aiAssistant.sourcePolicy.authorizedOnly ? '是' : '否'}；
            来源记录：{aiAssistant.sourcePolicy.sourceRequired ? '必填' : '未启用'}
          </p>
        </div>

        <div className="grid gap-2 md:col-span-2 sm:grid-cols-4">
          <MiniStat
            label="模型"
            value={aiAssistant.operations.currentModelName}
          />
          <MiniStat
            label="AI 记录"
            value={String(aiAssistant.operations.totalInteractions)}
          />
          <MiniStat
            label="待确认"
            value={String(reviewQueueItems.length)}
          />
          <MiniStat
            label="最近失败"
            value={aiAssistant.operations.latestFailureCode ?? 'none'}
          />
        </div>

        <div className="rounded-lg border border-[#f0d7a8] bg-[#fffaf0] px-3 py-3 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-sm font-extrabold text-[#765211]">
              待人工确认
            </p>
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-[#765211]">
              {reviewQueueItems.length}/{aiAssistant.reviewQueue.total}
            </span>
          </div>
          {reviewError ? (
            <p className="m-0 mt-3 rounded-lg border border-[#f0c4bd] bg-white px-3 py-2 text-xs font-bold leading-5 text-[#9d3a2f]">
              {reviewError}
            </p>
          ) : null}
          <div className="mt-3 grid gap-2">
            {reviewQueueItems.length > 0 ? (
              reviewQueueItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#efd7a4] bg-white px-3 py-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="m-0 break-words text-sm font-extrabold text-[#12383c]">
                        {item.sourceTitle}
                      </p>
                      <p className="m-0 mt-1 break-words text-xs font-semibold leading-5 text-[#6c817b]">
                        {item.scenario} / {item.modelName} / {item.createdAt}
                      </p>
                      <p className="m-0 mt-2 break-words text-sm font-semibold leading-6 text-[#345c58]">
                        {item.outputSummary}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.reviewActions.map((reviewAction) => {
                        const isCurrentAction =
                          reviewing?.id === item.id &&
                          reviewing.action === reviewAction.action
                        const isDisabled = Boolean(reviewing)
                        const buttonClass =
                          reviewAction.action === 'confirm'
                            ? 'rounded-lg border border-[#b7d8c8] bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359] disabled:cursor-not-allowed disabled:opacity-60'
                            : 'rounded-lg border border-[#f0c4bd] bg-[#fff1ef] px-3 py-2 text-xs font-extrabold text-[#9d3a2f] disabled:cursor-not-allowed disabled:opacity-60'

                        return (
                          <button
                            key={reviewAction.action}
                            type="button"
                            className={buttonClass}
                            disabled={isDisabled}
                            onClick={() =>
                              void handleReview(item.id, reviewAction.action)
                            }
                          >
                            {isCurrentAction ? '处理中' : reviewAction.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text={aiAssistant.reviewQueue.emptyState} />
            )}
          </div>
        </div>

        {aiAssistant.items.length > 0 ? (
          aiAssistant.items.map((interaction) => (
            <ListRow
              key={interaction.id}
              title={interaction.scenario}
              meta={`${interaction.modelName} / ${interaction.createdAt}`}
              value={`${interaction.costCents} cents`}
            />
          ))
        ) : (
          <EmptyState text="当前没有 AI 辅助记录。" />
        )}
      </div>
      <PaginationBar total={aiAssistant.total} nextCursor={aiAssistant.nextCursor} />
    </BusinessPanel>
  )
}

function readReviewErrorMessage(body: unknown) {
  if (!body || typeof body !== 'object' || !('errors' in body)) {
    return null
  }
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors)) {
    return null
  }
  const firstError = errors[0]
  if (!firstError || typeof firstError !== 'object') {
    return null
  }
  const message = (firstError as { message?: unknown }).message
  return typeof message === 'string' && message.length > 0 ? message : null
}

function WorkflowStrip({
  labels,
  footer,
}: {
  labels: string[]
  footer: string
}) {
  return (
    <div className="mt-3 rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3">
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-[#2d7359]"
          >
            {label}
          </span>
        ))}
      </div>
      <p className="m-0 mt-2 break-words text-xs font-semibold leading-5 text-[#6c817b]">
        {footer}
      </p>
    </div>
  )
}

function BusinessPanel({
  id,
  icon,
  title,
  badge,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  badge: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[#2d7359]">
          {icon}
          <h3 className="m-0 text-lg font-extrabold text-[#12383c]">{title}</h3>
        </div>
        <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
          {badge}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SidebarMenuGroup({ item }: { item: ConsoleMenuTreeItem }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? ChevronRight

  return (
    <section className="min-w-0 rounded-lg border border-white/8 bg-white/[0.04] p-1.5">
      <Link
        to="/console"
        className="flex min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-extrabold text-white no-underline transition hover:bg-white/10"
        activeProps={{ className: 'bg-white/12 text-white' }}
      >
        <Icon size={17} strokeWidth={2.4} className="shrink-0" />
        <span className="min-w-0 truncate">{item.title}</span>
        {item.children.length > 0 ? (
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#cde8dc]">
            {item.children.length}
          </span>
        ) : null}
      </Link>

      {item.children.length > 0 ? (
        <div className="mt-1 grid gap-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => {
            const ChildIcon =
              iconMap[child.icon as keyof typeof iconMap] ?? ChevronRight

            return (
              <Link
                key={child.id}
                to="/console"
                className="flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold text-[#b7d4c8] no-underline transition hover:bg-white/8 hover:text-white"
              >
                <ChildIcon size={14} strokeWidth={2.3} className="shrink-0" />
                <span className="min-w-0 truncate">{child.title}</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function FilterRow({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-md bg-[#f0f7f3] px-2.5 py-1.5 text-xs font-extrabold text-[#456b64]"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

function PaginationBar({
  total,
  nextCursor,
}: {
  total: number
  nextCursor: string | null
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f8fcf9] px-3 py-2 text-xs font-bold text-[#6c817b]">
      <span>total: {total}</span>
      <span className="break-all">
        nextCursor: {nextCursor ?? 'none'}
      </span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white px-3 py-2">
      <span className="block text-xs font-bold text-[#6c817b]">{label}</span>
      <span className="mt-1 block text-base font-extrabold text-[#12383c]">
        {value}
      </span>
    </div>
  )
}

function ListRow({
  title,
  meta,
  value,
}: {
  title: string
  meta: string
  value: string
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center">
      <span className="break-words font-extrabold text-[#12383c]">{title}</span>
      <span className="break-words text-xs font-semibold leading-5 text-[#6c817b]">
        {meta}
      </span>
      <span className="w-fit rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
        {value}
      </span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#bdd5c8] bg-[#f8fcf9] px-3 py-4 text-sm font-bold text-[#6c817b]">
      {text}
    </div>
  )
}

function PrdCoveragePanel({
  prdCoverage,
}: {
  prdCoverage: ReturnType<typeof getConsoleDataWorkbench>['prdCoverage']
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#2d7359]">
            <FileCheck2 size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              PRD 核心域覆盖
            </h2>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            S1-05 已补齐一期主域 D1 数据底座，页面和真实读写继续按域推进。
          </p>
        </div>
        <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
          {prdCoverage.domains.length} domains / {prdCoverage.tableCount} tables
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {prdCoverage.domains.map((domain) => (
          <div
            key={domain.id}
            className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-extrabold text-[#12383c]">
                {domain.title}
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
                {domain.tableCount} tables
              </span>
            </div>
            <p className="m-0 mt-2 text-xs font-semibold leading-5 text-[#6c817b]">
              {domain.prdRefs.join(' / ')}
            </p>
            <span className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#456b64]">
              {domain.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RenkeDevicePanel({
  renke,
  deviceStatus,
}: {
  renke: ReturnType<typeof getConsoleDataWorkbench>['renke']
  deviceStatus: ReturnType<typeof getConsoleDataWorkbench>['deviceStatus']
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#2d7359]">
            <RadioTower size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              Renke 设备接入
            </h2>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            供应商接口由服务端路由调用，凭据从环境变量读取。
          </p>
        </div>
        <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
          {renke.providerId}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TelemetryFact
          icon={<RadioTower size={17} />}
          label="设备"
          value={renke.deviceAddr}
          detail={renke.syncEndpoint}
        />
        <TelemetryFact
          icon={<Wifi size={17} />}
          label="在线"
          value={String(deviceStatus.onlineCount)}
          detail={renke.latestEndpoint}
        />
        <TelemetryFact
          icon={<WifiOff size={17} />}
          label="离线"
          value={String(deviceStatus.offlineCount)}
          detail="5 分钟未上报"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[#d7e6db]">
        {deviceStatus.devices.map((device) => (
          <div
            key={device.deviceId}
            className="grid gap-2 border-b border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 text-sm last:border-b-0 sm:grid-cols-[1.2fr_0.8fr_0.8fr]"
          >
            <span className="font-extrabold text-[#12383c]">
              {device.deviceName}
            </span>
            <span className="font-semibold text-[#5b736d]">
              {device.lastSeenAt ?? '无数据'}
            </span>
            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
              {device.onlineStatus === 'offline' ? (
                <WifiOff size={14} />
              ) : (
                <Wifi size={14} />
              )}
              {device.onlineStatus}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {deviceStatus.alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border border-[#f0d49a] bg-[#fff8e8] px-3 py-2 text-sm font-bold leading-6 text-[#7a5a19]"
          >
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} />
              {alert.reason}
            </span>
            <span className="ml-2 font-semibold">触发：{alert.triggeredAt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompliancePanel({
  compliance,
}: {
  compliance: ReturnType<typeof getConsoleDataWorkbench>['compliance']
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#2d7359]">
            <FileCheck2 size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              标准稽核
            </h2>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            稽核项追溯到 Spec 条目和 GitHub Issue，当前无发布阻断项。
          </p>
        </div>
        <a
          href="/api/compliance/checklist?format=markdown"
          className="inline-flex items-center gap-2 rounded-lg border border-[#c8ddd0] bg-white px-3 py-2 text-sm font-bold text-[#12383c] no-underline transition hover:bg-[#f7fbf8]"
        >
          <Download size={16} />
          导出快照
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <TelemetryFact
          icon={<FileCheck2 size={17} />}
          label="检查项"
          value={String(compliance.total)}
          detail={compliance.generatedAt}
        />
        <TelemetryFact
          icon={<CheckCircle2 size={17} />}
          label="已覆盖"
          value={String(compliance.covered)}
          detail="covered"
        />
        <TelemetryFact
          icon={<AlertTriangle size={17} />}
          label="缺口"
          value={String(compliance.gaps)}
          detail="gap"
        />
        <TelemetryFact
          icon={<Lock size={17} />}
          label="阻断"
          value={String(compliance.blockers)}
          detail="blocker"
        />
      </div>

      <div className="mt-4 space-y-2">
        {compliance.items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-[#12383c]">
                {item.id} {item.title}
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
                {item.issue} / {item.status}
              </span>
            </div>
            <p className="m-0 mt-2 text-xs font-semibold leading-5 text-[#6c817b]">
              {item.specRef}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DictionaryCoveragePanel({
  dictionary,
}: {
  dictionary: ReturnType<typeof getConsoleDataWorkbench>['dictionary']
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#2d7359]">
            <BookOpen size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              标准字典覆盖
            </h2>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            S0-01 已接入后台首屏，分类和条目来自标准字典单源定义。
          </p>
        </div>
        <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
          {dictionary.version}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dictionary.categories.map((category) => (
          <div
            key={category.category}
            className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-[#12383c]">
                {category.label}
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
                {category.activeCount}/{category.count}
              </span>
            </div>
            <p className="m-0 mt-2 text-xs font-semibold text-[#6c817b]">
              active / total
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TelemetryModelPanel({
  telemetry,
}: {
  telemetry: ReturnType<typeof getConsoleDataWorkbench>['telemetry']
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#2d7359]">
            <RadioTower size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              遥测数据底座
            </h2>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-[#5b736d]">
            S1-01 已接入后台首屏，生产环境优先展示 D1 最近遥测数据。
          </p>
        </div>
        <span className="rounded-lg bg-[#e8f5ef] px-3 py-2 text-xs font-extrabold text-[#2d7359]">
          {telemetry.metricCount} metrics
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TelemetryFact
          icon={<Table2 size={17} />}
          label="最近值表"
          value={telemetry.latestTable}
          detail={telemetry.latestConflictTarget}
        />
        <TelemetryFact
          icon={<History size={17} />}
          label="历史表"
          value={telemetry.historyTable}
          detail={`cursor: ${telemetry.sampleHistoryQuery.orderBy.join(' / ')}`}
        />
      </div>

      <div className="mt-4 rounded-lg border border-[#d7e6db] bg-[#f8fcf9] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-[#12383c]">
            {telemetry.productionLatest.length > 0 ? '生产最近值' : '示例最近值'}
          </span>
          <span className="rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
            {telemetry.productionLatest.length > 0
              ? `${telemetry.productionLatest.length} rows`
              : telemetry.sampleLatest.metricCode}
          </span>
        </div>
        {telemetry.productionLatest.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {telemetry.productionLatest.map((record) => (
              <div
                key={record.id}
                className="grid gap-2 rounded-lg border border-[#d7e6db] bg-white px-3 py-2 text-sm font-semibold text-[#5b736d] sm:grid-cols-[1fr_1fr_auto]"
              >
                <span className="break-words">{record.deviceId}</span>
                <span className="break-words">
                  {record.metricCode}: {record.value} {record.unit}
                </span>
                <span className="break-words">{record.observedAt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-2 text-sm font-semibold text-[#5b736d] sm:grid-cols-3">
            <span>{telemetry.sampleLatest.deviceId}</span>
            <span>
              {telemetry.sampleLatest.value} {telemetry.sampleLatest.unit}
            </span>
            <span>{telemetry.sampleLatest.observedAt}</span>
          </div>
        )}
      </div>

      <p className="m-0 mt-4 rounded-lg bg-[#fff8e8] px-3 py-2 text-sm font-bold leading-6 text-[#7a5a19]">
        {telemetry.emptyState}
      </p>
    </div>
  )
}

function TelemetryFact({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3">
      <div className="flex items-center gap-2 text-[#2d7359]">
        {icon}
        <span className="text-xs font-extrabold uppercase tracking-[0.08em]">
          {label}
        </span>
      </div>
      <p className="m-0 mt-2 break-words text-sm font-extrabold text-[#12383c]">
        {value}
      </p>
      <p className="m-0 mt-1 break-words text-xs font-semibold leading-5 text-[#6c817b]">
        {detail}
      </p>
    </div>
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
