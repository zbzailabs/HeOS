import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudSun,
  Droplets,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  Leaf,
  ListChecks,
  MapPin,
  Maximize2,
  Plus,
  Search,
  Sprout,
  Thermometer,
  Wifi,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/')({ component: HeOSDemo })

type TaskStatus = 'today' | 'active' | 'review'
type Task = {
  id: number
  title: string
  area: string
  due: string
  owner: string
  priority: '高' | '中' | '低'
  status: TaskStatus
  progress?: number
}

const bases = ['苏州示范基地', '太平基地', '新民基地']
const seasons = ['2024 春茬番茄', '2024 水稻种植项目', '2024 秋茬草莓']

const navigation = [
  ['工作台', Home],
  ['基地资产', MapPin],
  ['大棚', LayoutDashboard],
  ['作物周期', Sprout],
  ['设备监测', Wifi],
  ['农事任务', ListChecks],
  ['告警中心', Bell],
  ['追溯资料', FileText],
  ['AI 农艺师', Bot],
] as const

const metrics = [
  {
    label: '作物阶段',
    value: '膨果期',
    helper: '第 45 天 / 预计 66 天',
    icon: Leaf,
    tone: 'green',
  },
  {
    label: '生长天数',
    value: '45 天',
    helper: '定植：2024-04-06',
    icon: CalendarDays,
    tone: 'mint',
  },
  {
    label: '环境达标率',
    value: '86%',
    helper: '较昨日 ↑ 6%',
    icon: Gauge,
    tone: 'green',
  },
  {
    label: '设备在线率',
    value: '92.3%',
    helper: '在线 24 / 总数 26',
    icon: Wifi,
    tone: 'teal',
  },
  {
    label: '未处理告警',
    value: '8 条',
    helper: '较昨日 ↓ 3',
    icon: AlertTriangle,
    tone: 'red',
  },
  {
    label: '基地环境',
    value: '26.5°C',
    helper: '湿度 72% · 光照 420 μmol',
    icon: CloudSun,
    tone: 'blue',
  },
]

const zoneReadings = [
  { zone: 'A区', top: '26.3°C', mid: '71%RH', bottom: '1.8kPa', x: 22, y: 24 },
  { zone: 'B区', top: '25.7°C', mid: '69%RH', bottom: '1.7kPa', x: 54, y: 22 },
  { zone: 'C区', top: '26.3°C', mid: '72%RH', bottom: '1.8kPa', x: 28, y: 54 },
  { zone: 'D区', top: '26.4°C', mid: '70%RH', bottom: '1.7kPa', x: 67, y: 58 },
]

const initialTasks: Task[] = [
  {
    id: 1,
    title: '绑蔓与整枝',
    area: '1号番茄大棚 - A区',
    due: '09:00 截止',
    owner: '李强',
    priority: '高',
    status: 'today',
  },
  {
    id: 2,
    title: '水肥一体化施肥',
    area: '1号番茄大棚 - B区',
    due: '10:30 截止',
    owner: '王霞',
    priority: '中',
    status: 'today',
  },
  {
    id: 3,
    title: '疏花疏果',
    area: '1号番茄大棚 - C区',
    due: '08:40 开始',
    owner: '步倩',
    priority: '中',
    status: 'active',
    progress: 60,
  },
  {
    id: 4,
    title: '叶面补钙',
    area: '1号番茄大棚 - D区',
    due: '09:10 开始',
    owner: '程明',
    priority: '低',
    status: 'active',
    progress: 40,
  },
  {
    id: 5,
    title: '灌溉带冲洗',
    area: '1号番茄大棚 - 全棚',
    due: '07:45 完成',
    owner: '李强',
    priority: '低',
    status: 'review',
  },
  {
    id: 6,
    title: '病叶清除',
    area: '1号番茄大棚 - A区',
    due: '08:20 完成',
    owner: '赵明',
    priority: '中',
    status: 'review',
  },
]

const traceRecords = [
  ['09:20', '水肥一体化施肥（B区）', '大量元素水溶肥 15kg，EC 2.2 mS/cm，pH 6.2'],
  ['08:35', '叶面补钙（D区）', '硝酸钙 800 倍，棚内 25°C，湿度 72%'],
  ['07:45', '灌溉带冲洗（全棚）', '冲洗 15 分钟，水压 0.28 MPa'],
]

const inputs = [
  ['水', 1280, 't', 64],
  ['氮肥', 198, 'kg', 58],
  ['磷肥', 86, 'kg', 49],
  ['钾肥', 210, 'kg', 62],
  ['农药', 12.6, 'L', 45],
]

const chartPoints = [
  32, 34, 35, 33, 31, 30, 31, 33, 34, 35, 33, 32, 31, 30, 31, 33, 34, 33,
]

function HeOSDemo() {
  const [base, setBase] = useState(bases[0])
  const [season, setSeason] = useState(seasons[0])
  const [metric, setMetric] = useState('温度')
  const [tasks, setTasks] = useState(initialTasks)
  const [traceFilter, setTraceFilter] = useState('全部')
  const [alertOpen, setAlertOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(true)
  const [generatedTask, setGeneratedTask] = useState(false)

  const taskGroups = useMemo(
    () => [
      { id: 'today' as const, title: '今日待办', count: 5, tone: 'amber' },
      { id: 'active' as const, title: '进行中', count: 3, tone: 'green' },
      { id: 'review' as const, title: '待验收', count: 2, tone: 'blue' },
    ],
    [],
  )

  const completeTask = (taskId: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: 'review', progress: 100 } : task,
      ),
    )
  }

  const addAiTask = () => {
    if (generatedTask) return
    setTasks((current) => [
      {
        id: 99,
        title: 'B区湿度专项巡检',
        area: '1号番茄大棚 - B区',
        due: '11:30 截止',
        owner: 'AI 派发',
        priority: '高',
        status: 'today',
      },
      ...current,
    ])
    setGeneratedTask(true)
  }

  return (
    <main className="heos-demo min-h-screen bg-[#f5f7f4] text-[#17241f]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[148px_minmax(0,1fr)]">
        <aside className="hidden bg-[#063f2a] text-white lg:flex lg:flex-col">
          <div className="px-5 pb-5 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#36c878] text-[#063f2a]">
                <Leaf size={19} strokeWidth={2.8} />
              </span>
              <span className="text-2xl font-bold tracking-tight">HeOS</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/72">
              作物种植一体化服务与智能管理平台
            </p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {navigation.map(([label, Icon], index) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  index === 0
                    ? 'bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]'
                    : 'text-white/78 hover:bg-white/10 hover:text-white'
                }`}
                type="button"
              >
                <Icon size={17} />
                <span>{label}</span>
                {label === '告警中心' ? (
                  <span className="ml-auto rounded-full bg-[#f04438] px-1.5 py-0.5 text-[10px] leading-none">
                    18
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <button
            className="m-3 rounded-lg border border-white/14 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white/86"
            type="button"
          >
            收起菜单
          </button>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[#e4e8e1] bg-white/94 px-4 py-3 backdrop-blur lg:px-8">
            <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap">
              <SelectLike value="华东农业集团" />
              <SelectLike value={base} onNext={() => cycleValue(base, bases, setBase)} />
              <SelectLike
                className="col-span-2 sm:min-w-52"
                value={season}
                onNext={() => cycleValue(season, seasons, setSeason)}
              />
              <SelectLike className="col-span-2 sm:min-w-64" icon={<CalendarDays size={15} />} value="2024-05-20 ~ 2024-05-26" />
              <div className="col-span-2 flex min-w-0 flex-1 items-center justify-end gap-3 sm:ml-auto lg:flex-none">
                <label className="hidden h-10 min-w-72 items-center gap-2 rounded-lg border border-[#dfe5dc] bg-[#fafbf9] px-3 text-sm text-[#6b756e] xl:flex">
                  <Search size={17} />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="搜索项目、基地、设备、告警等"
                  />
                </label>
                <button
                  className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#057a45] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#046a3d] sm:flex-none"
                  type="button"
                  onClick={addAiTask}
                >
                  <Plus size={17} />
                  新建任务
                </button>
                <button className="relative rounded-lg p-2 text-[#17241f] hover:bg-[#eff4ee]" type="button">
                  <Bell size={19} />
                  <span className="absolute right-1 top-1 rounded-full bg-[#f04438] px-1 text-[10px] leading-4 text-white">
                    12
                  </span>
                </button>
                <div className="hidden items-center gap-2 lg:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e9e5] font-bold">
                    张
                  </div>
                  <div className="text-sm leading-tight">
                    <div className="font-bold">张伟</div>
                    <div className="text-xs text-[#69736c]">基地管理员</div>
                  </div>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-4 px-4 py-4 lg:px-8">
            <section className="grid gap-px overflow-hidden rounded-xl border border-[#e2e7df] bg-[#e2e7df] md:grid-cols-2 xl:grid-cols-6">
              {metrics.map((item) => (
                <MetricCard key={item.label} {...item} />
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
              <div className="overflow-hidden rounded-xl border border-[#e2e7df] bg-white">
                <div className="flex flex-wrap items-center gap-3 border-b border-[#e9eee7] px-4 py-3">
                  <h2 className="mr-auto text-lg font-bold">大棚平面与实时监测</h2>
                  {['平面图', '分区图', '设备分布'].map((item) => (
                    <button
                      key={item}
                      className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                        item === '平面图'
                          ? 'bg-[#e9f5ee] text-[#057a45]'
                          : 'text-[#657068] hover:bg-[#f2f5f1]'
                      }`}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                  <button className="ml-auto hidden items-center gap-1 rounded-md border border-[#dfe5dc] px-2.5 py-1.5 text-sm font-semibold text-[#33423a] md:inline-flex" type="button">
                    <Maximize2 size={14} />
                    全屏
                  </button>
                </div>
                <div className="relative min-h-[345px] overflow-hidden">
                  <img
                    alt="苏州示范基地大棚航拍"
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/heos/greenhouse-aerial.png"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,63,42,0.18),rgba(6,63,42,0.02))]" />
                  {zoneReadings.map((reading) => (
                    <div
                      key={reading.zone}
                      className="absolute rounded-lg bg-white/94 px-3 py-2 text-xs shadow-[0_10px_30px_rgba(5,49,32,0.24)] ring-1 ring-black/5"
                      style={{ left: `${reading.x}%`, top: `${reading.y}%` }}
                    >
                      <div className="mb-1 flex items-center gap-1 font-bold text-[#063f2a]">
                        <CheckCircle2 size={13} className="text-[#0e9f6e]" />
                        {reading.zone}
                      </div>
                      <div>{reading.top}</div>
                      <div>{reading.mid}</div>
                      <div>{reading.bottom}</div>
                    </div>
                  ))}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg bg-white/92 px-3 py-2 text-xs font-semibold shadow">
                    <Legend color="#0e9f6e" label="正常" />
                    <Legend color="#f59e0b" label="预警" />
                    <Legend color="#ef4444" label="高风险" />
                    <Legend color="#9ca3af" label="离线" />
                  </div>
                </div>
                <div className="border-t border-[#e9eee7] p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="mr-auto text-base font-bold">实时环境曲线</h3>
                    {['温度', '湿度', 'CO₂', '光照', '土壤EC'].map((item) => (
                      <button
                        key={item}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          metric === item
                            ? 'bg-[#063f2a] text-white'
                            : 'bg-[#eef3ed] text-[#657068] hover:bg-[#e4ece3]'
                        }`}
                        type="button"
                        onClick={() => setMetric(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px]">
                    <Sparkline selected={metric} />
                    <div className="rounded-lg bg-[#f6f8f5] p-3">
                      <div className="text-xs font-semibold text-[#66716a]">当前值（均值）</div>
                      <div className="mt-2 text-3xl font-bold">25.7°C</div>
                      <div className="mt-1 text-xs leading-5 text-[#66716a]">今日范围 24.1 ~ 28.6°C</div>
                      <div className="text-xs leading-5 text-[#66716a]">达标范围 22 ~ 28°C</div>
                      <div className="text-xs leading-5 text-[#66716a]">更新时间 09:45</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e2e7df] bg-white">
                <div className="flex items-center border-b border-[#e9eee7] px-4 py-3">
                  <h2 className="text-lg font-bold">农事任务看板</h2>
                  <button className="ml-auto rounded-md px-2 py-1 text-sm font-semibold text-[#66716a] hover:bg-[#f3f6f2]" type="button">
                    全部任务 <ChevronDown size={14} className="inline" />
                  </button>
                </div>
                <div className="grid gap-px bg-[#e9eee7] md:grid-cols-3 xl:grid-cols-3">
                  {taskGroups.map((group) => (
                    <div key={group.id} className="min-h-[400px] bg-white p-3">
                      <div className={`mb-3 rounded-lg border px-3 py-2 text-sm font-bold ${groupTone(group.tone)}`}>
                        {group.title}
                        <span className="ml-2">{tasks.filter((task) => task.status === group.id).length}</span>
                      </div>
                      <div className="space-y-2">
                        {tasks
                          .filter((task) => task.status === group.id)
                          .map((task) => (
                            <TaskItem key={task.id} task={task} onComplete={completeTask} />
                          ))}
                      </div>
                      <button
                        className="mt-3 w-full rounded-lg border border-dashed border-[#cfd8cf] py-2 text-sm font-semibold text-[#057a45] hover:bg-[#f5faf6]"
                        type="button"
                        onClick={addAiTask}
                      >
                        + 添加任务
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] 2xl:grid-cols-[1fr_0.95fr_0.75fr_1fr]">
              <Panel title="作物周期进度">
                <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
                  {['育苗期', '定植期', '缓苗期', '开花期', '膨果期', '转色期', '采收期'].map((stage, index) => (
                    <div key={stage} className="flex min-w-20 flex-col items-center gap-1 text-center">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        index <= 4 ? 'border-[#0e9f6e] bg-[#e7f6ee] text-[#057a45]' : 'border-[#d8ded6] bg-white text-[#8a958e]'
                      }`}>
                        <Sprout size={14} />
                      </span>
                      <span className="text-xs font-semibold">{stage}</span>
                      <span className="text-[11px] text-[#778179]">{['03-15','04-06','04-13','04-24','05-15','06-21','07-06'][index]}</span>
                    </div>
                  ))}
                </div>
                <div className="mb-3 text-sm font-semibold">当前阶段：膨果期（第45天 / 预计66天）</div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e1e7df]">
                  <div className="h-full w-[68%] rounded-full bg-[#057a45]" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  {[
                    ['单果重', '82 g'],
                    ['果实横径', '64 mm'],
                    ['可溶性固形物', '4.6 °Brix'],
                    ['坐果率', '82%'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-[#f6f8f5] p-3">
                      <div className="text-xs text-[#66716a]">{label}</div>
                      <div className="mt-1 text-lg font-bold">{value}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="追溯记录">
                <div className="mb-3 flex gap-1">
                  {['全部', '农事', '施肥', '用药', '采收'].map((item) => (
                    <button
                      key={item}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        traceFilter === item ? 'bg-[#e7f6ee] text-[#057a45]' : 'text-[#66716a] hover:bg-[#f3f6f2]'
                      }`}
                      type="button"
                      onClick={() => setTraceFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {traceRecords.map(([time, title, detail], index) => (
                    <div key={title} className="grid grid-cols-[44px_1fr_64px] gap-3 border-b border-[#edf1eb] pb-3 last:border-0">
                      <span className="text-xs font-bold text-[#057a45]">{time}</span>
                      <div>
                        <div className="text-sm font-bold">{title}</div>
                        <div className="mt-1 text-xs leading-5 text-[#66716a]">{detail}</div>
                      </div>
                      <div className={`h-14 rounded-lg bg-cover bg-center ${index === 0 ? 'bg-[linear-gradient(135deg,#dbe8d2,#789b6f)]' : index === 1 ? 'bg-[linear-gradient(135deg,#d7ead8,#3f8f62)]' : 'bg-[linear-gradient(135deg,#cbd7c6,#5d8068)]'}`} />
                    </div>
                  ))}
                </div>
                <button className="mt-2 text-sm font-bold text-[#057a45]" type="button">
                  查看全部记录 <ChevronRight size={14} className="inline" />
                </button>
              </Panel>

              <Panel title="投入品使用（本季）">
                <div className="space-y-3">
                  {inputs.map(([name, value, unit, percent]) => (
                    <div key={name as string}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold">{name}</span>
                        <span className="font-bold">
                          {value as number} {unit}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e5ebe3]">
                        <div className="h-full rounded-full bg-[#057a45]" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-5 text-sm font-bold text-[#057a45]" type="button">
                  查看投入明细 <ChevronRight size={14} className="inline" />
                </button>
              </Panel>

              <Panel
                action={
                  <button
                    className="rounded-md border border-[#b7dec9] px-2 py-1 text-xs font-bold text-[#057a45]"
                    type="button"
                    onClick={() => setAiOpen((value) => !value)}
                  >
                    {aiOpen ? '收起' : '展开'}
                  </button>
                }
                title="AI 农艺师建议"
              >
                {aiOpen ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-[#465149]">
                      基于传感器、任务和追溯数据分析，B区湿度持续偏高，建议加强通风并安排专项巡检。
                    </p>
                    <AiFinding
                      icon={<AlertTriangle size={17} />}
                      tone="red"
                      title="B区湿度偏高（当前83%RH）"
                      body="持续时间超 2 小时，建议加强通风降湿，降低灰霉病风险。"
                    />
                    <AiFinding
                      icon={<CheckCircle2 size={17} />}
                      tone="green"
                      title="当前单果重 82g"
                      body="较目标偏低，建议追施钾肥并适度控水，促进果实膨大。"
                    />
                    <button
                      className="w-full rounded-lg bg-[#057a45] py-2 text-sm font-bold text-white disabled:bg-[#a9b8ad]"
                      disabled={generatedTask}
                      type="button"
                      onClick={addAiTask}
                    >
                      {generatedTask ? '已生成巡检任务' : '采纳并生成任务'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#66716a]">AI 建议已收起。</p>
                )}
              </Panel>
            </section>
          </div>
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 hidden rounded-full bg-[#057a45] px-4 py-3 text-sm font-bold text-white shadow-xl xl:inline-flex"
        type="button"
        onClick={() => setAlertOpen(true)}
      >
        处理高湿告警
      </button>

      {alertOpen ? <AlertDialog onClose={() => setAlertOpen(false)} /> : null}
    </main>
  )
}

function SelectLike({
  value,
  icon,
  onNext,
  className = '',
}: {
  value: string
  icon?: ReactNode
  onNext?: () => void
  className?: string
}) {
  return (
    <button
      className={`inline-flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#dfe5dc] bg-white px-3 text-sm font-semibold text-[#27352e] shadow-sm hover:bg-[#f8faf7] ${className}`}
      type="button"
      onClick={onNext}
    >
      {icon}
      <span className="truncate">{value}</span>
      <ChevronDown size={15} className="ml-auto text-[#7b867e]" />
    </button>
  )
}

function cycleValue<T>(current: T, values: T[], setter: (value: T) => void) {
  const nextIndex = (values.indexOf(current) + 1) % values.length
  setter(values[nextIndex])
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: (typeof metrics)[number]) {
  return (
    <article className="flex min-h-28 items-center gap-4 bg-white px-5 py-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${metricTone(tone)}`}>
        <Icon size={23} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-[#27352e]">{label}</div>
        <div className="mt-1 truncate text-3xl font-bold tracking-tight">{value}</div>
        <div className="mt-1 truncate text-xs font-semibold text-[#68736b]">{helper}</div>
      </div>
    </article>
  )
}

function metricTone(tone: string) {
  const tones: Record<string, string> = {
    green: 'bg-[#e7f6ee] text-[#057a45]',
    mint: 'bg-[#eaf8f1] text-[#0e9f6e]',
    teal: 'bg-[#e8f6f5] text-[#087e8b]',
    red: 'bg-[#feecec] text-[#e03131]',
    blue: 'bg-[#eef5ff] text-[#2563eb]',
  }
  return tones[tone] ?? tones.green
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function Sparkline({ selected }: { selected: string }) {
  const height = 122
  const width = 520
  const path = chartPoints
    .map((point, index) => {
      const x = (index / (chartPoints.length - 1)) * width
      const y = height - ((point - 25) / 14) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="rounded-lg bg-[#fbfcfa] p-3">
      <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
        {[
          ['温度(°C)', '25.7', 'green'],
          ['湿度(%RH)', '72', 'blue'],
          ['土壤EC(mS/cm)', '2.18', 'purple'],
        ].map(([label, value, tone]) => (
          <div key={label}>
            <div className="text-xs font-semibold text-[#66716a]">{label}</div>
            <div className="text-lg font-bold">
              {value}
              {selected === label.replace(/\(.*/, '') ? (
                <span className="ml-1 text-xs text-[#0e9f6e]">当前</span>
              ) : null}
            </div>
            <div className={`h-0.5 w-10 ${tone === 'green' ? 'bg-[#0e9f6e]' : tone === 'blue' ? 'bg-[#3b82f6]' : 'bg-[#8b5cf6]'}`} />
          </div>
        ))}
      </div>
      <svg className="h-32 w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
        <title>环境监测趋势</title>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            stroke="#e3e9e2"
            strokeWidth="1"
            x1="0"
            x2={width}
            y1={(line / 3) * height}
            y2={(line / 3) * height}
          />
        ))}
        <path d={path} fill="none" stroke="#0e9f6e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill="rgba(14,159,110,0.09)"
        />
      </svg>
    </div>
  )
}

function groupTone(tone: string) {
  const tones: Record<string, string> = {
    amber: 'border-[#f7d8a6] bg-[#fff8ec] text-[#b45309]',
    green: 'border-[#bfe6cc] bg-[#f1fbf4] text-[#057a45]',
    blue: 'border-[#c6dbff] bg-[#f4f8ff] text-[#2563eb]',
  }
  return tones[tone]
}

function TaskItem({ task, onComplete }: { task: Task; onComplete: (taskId: number) => void }) {
  return (
    <article className="rounded-lg border border-[#e6ebe4] bg-[#fcfdfb] p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">{task.title}</h3>
          <p className="mt-1 truncate text-xs text-[#66716a]">{task.area}</p>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${priorityTone(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#66716a]">
        <span>{task.due}</span>
        <span className="font-semibold">{task.owner}</span>
      </div>
      {typeof task.progress === 'number' ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5ebe3]">
          <div className="h-full rounded-full bg-[#057a45]" style={{ width: `${task.progress}%` }} />
        </div>
      ) : null}
      {task.status !== 'review' ? (
        <button
          className="mt-3 w-full rounded-md border border-[#b7dec9] py-1.5 text-xs font-bold text-[#057a45] hover:bg-[#f0faf4]"
          type="button"
          onClick={() => onComplete(task.id)}
        >
          {task.status === 'today' ? '开始处理' : '提交验收'}
        </button>
      ) : (
        <button className="mt-3 w-full rounded-md border border-[#b7dec9] py-1.5 text-xs font-bold text-[#057a45] hover:bg-[#f0faf4]" type="button">
          验收
        </button>
      )}
    </article>
  )
}

function priorityTone(priority: Task['priority']) {
  const tones = {
    高: 'bg-[#feecec] text-[#e03131]',
    中: 'bg-[#fff3d7] text-[#b45309]',
    低: 'bg-[#e7f6ee] text-[#057a45]',
  }
  return tones[priority]
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#e2e7df] bg-white p-4">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </section>
  )
}

function AiFinding({
  icon,
  tone,
  title,
  body,
}: {
  icon: ReactNode
  tone: 'red' | 'green'
  title: string
  body: string
}) {
  return (
    <div className={`rounded-lg border p-3 ${tone === 'red' ? 'border-[#f7d0d0] bg-[#fff7f6]' : 'border-[#c8e9d3] bg-[#f4fbf6]'}`}>
      <div className={`mb-2 flex items-center gap-2 text-sm font-bold ${tone === 'red' ? 'text-[#d92d20]' : 'text-[#057a45]'}`}>
        {icon}
        {title}
      </div>
      <p className="m-0 text-xs leading-5 text-[#5d6861]">{body}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {['传感器', '任务', '追溯'].map((source) => (
          <span key={source} className="rounded bg-white px-2 py-1 text-[11px] font-bold text-[#587064] ring-1 ring-[#d8e7dd]">
            数据来源：{source}
          </span>
        ))}
      </div>
    </div>
  )
}

function AlertDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 p-4">
      <section className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-[#feecec] p-2 text-[#e03131]">
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">B区湿度持续偏高</h2>
            <p className="mt-1 text-sm leading-6 text-[#66716a]">
              当前湿度 83%RH，已连续 2 小时超过膨果期建议范围。系统建议安排通风降湿与现场巡检。
            </p>
          </div>
          <button className="rounded-md p-1 hover:bg-[#f2f5f1]" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <InfoCell icon={<Thermometer size={16} />} label="温度" value="25.7°C" />
          <InfoCell icon={<Droplets size={16} />} label="湿度" value="83%RH" />
          <InfoCell icon={<Activity size={16} />} label="风险" value="灰霉病" />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-[#d8ded6] px-4 py-2 text-sm font-bold" type="button" onClick={onClose}>
            稍后处理
          </button>
          <button className="rounded-lg border border-[#b7dec9] px-4 py-2 text-sm font-bold text-[#057a45]" type="button" onClick={onClose}>
            派发巡检
          </button>
          <button className="rounded-lg bg-[#057a45] px-4 py-2 text-sm font-bold text-white" type="button" onClick={onClose}>
            标记处理中
          </button>
        </div>
      </section>
    </div>
  )
}

function InfoCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f6f8f5] p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-bold text-[#66716a]">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}
