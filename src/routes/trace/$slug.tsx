import { createFileRoute, Link } from "@tanstack/react-router"
import { Calendar, CheckCircle2, FileText, Leaf, MapPinned } from "lucide-react"

import type { PublicTraceDetail } from "../../domain/trace/detail"
import { getPublicTraceDetail } from "../../lib/trace-data"

export const Route = createFileRoute("/trace/$slug")({
  loader: async ({ params }) => {
    const detail = await getPublicTraceDetail({ data: { slug: params.slug } })

    if (!detail) {
      throw new Response("Trace archive not found.", { status: 404 })
    }

    return { detail }
  },
  component: TraceDetailPage,
})

function TraceDetailPage() {
  const { detail } = Route.useLoaderData()

  return (
    <main className="min-h-screen bg-[#edf6ef] text-[#12383c]">
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="w-fit rounded-lg border border-[#c8ddd0] bg-white px-3 py-2 text-sm font-extrabold text-[#12383c] no-underline"
        >
          HeOS
        </Link>

        <header className="rounded-lg border border-[#d7e6db] bg-white p-5 shadow-[0_18px_44px_rgba(18,56,60,0.08)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[#2d7359]">
            <Leaf size={20} />
            <span className="text-sm font-extrabold">公开追溯档案</span>
          </div>
          <h1 className="m-0 mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {detail.cropCycleName}
          </h1>
          <p className="m-0 mt-2 text-sm font-semibold leading-6 text-[#5b736d]">
            {detail.projectName} / {detail.publicSlug}
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <TraceFact
            icon={<MapPinned size={18} />}
            label="项目"
            value={detail.projectName}
          />
          <TraceFact
            icon={<Calendar size={18} />}
            label="生成时间"
            value={detail.createdAt}
          />
          <TraceFact
            icon={<CheckCircle2 size={18} />}
            label="公开状态"
            value={detail.visibility}
          />
        </section>

        <section className="rounded-lg border border-[#d7e6db] bg-white p-5 shadow-[0_18px_44px_rgba(18,56,60,0.08)]">
          <div className="flex items-center gap-2 text-[#2d7359]">
            <FileText size={19} />
            <h2 className="m-0 text-lg font-extrabold text-[#12383c]">
              检测与巡检摘要
            </h2>
          </div>
          <div className="mt-4 grid gap-2">
            {detail.inspectionSummary.length > 0 ? (
              detail.inspectionSummary.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 text-sm font-bold leading-6 text-[#456b64]"
                >
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#bdd5c8] bg-[#f8fcf9] px-3 py-4 text-sm font-bold text-[#6c817b]">
                当前公开档案没有检测摘要。
              </div>
            )}
          </div>
        </section>

        <TraceRecords records={detail.agriRecords} />
      </section>
    </main>
  )
}

function TraceRecords({ records }: { records: PublicTraceDetail["agriRecords"] }) {
  return (
    <section className="rounded-lg border border-[#d7e6db] bg-white p-5 shadow-[0_18px_44px_rgba(18,56,60,0.08)]">
      <h2 className="m-0 text-lg font-extrabold text-[#12383c]">农事记录</h2>
      <div className="mt-4 grid gap-3">
        {records.length > 0 ? (
          records.map((record) => (
            <article
              key={record.id}
              className="grid gap-2 rounded-lg border border-[#d7e6db] bg-[#f8fcf9] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <h3 className="m-0 break-words text-base font-extrabold">
                  {record.taskTitle}
                </h3>
                <p className="m-0 mt-1 break-words text-xs font-semibold leading-5 text-[#6c817b]">
                  {record.executedAt} / {record.notes ?? "无备注"}
                </p>
              </div>
              <span className="h-fit w-fit rounded-md bg-white px-2 py-1 text-xs font-extrabold text-[#2d7359]">
                {record.acceptanceResult}
              </span>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#bdd5c8] bg-[#f8fcf9] px-3 py-4 text-sm font-bold text-[#6c817b]">
            当前公开档案没有农事记录。
          </div>
        )}
      </div>
    </section>
  )
}

function TraceFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-[#d7e6db] bg-white p-4 shadow-[0_18px_44px_rgba(18,56,60,0.08)]">
      <div className="flex items-center gap-2 text-[#2d7359]">
        {icon}
        <span className="text-xs font-extrabold">{label}</span>
      </div>
      <p className="m-0 mt-2 break-words text-sm font-bold leading-6">{value}</p>
    </div>
  )
}
