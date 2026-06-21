import { AreaChart } from "@tremor/react"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"

import { categories, logs, recentIncidents, responseTrend, stats } from "@/lib/mock-data"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

const icons = [Clock, AlertTriangle, Activity, Radio]

function Dashboard() {
  return (
    <main className="min-h-full bg-[#f5f7f8] p-4 text-[#073f31] lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = icons[index] ?? Activity

            return (
              <article key={stat.label} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-black tracking-[-0.06em]">{stat.value}</span>
                  {stat.unit && <span className="mb-1 text-sm font-semibold">{stat.unit}</span>}
                  <span className={stat.good ? "mb-2 ml-2 text-xs font-bold text-primary" : "mb-2 ml-2 text-xs font-bold text-red-600"}>
                    {stat.trend}
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-[#b8ec67]" />
                </div>
              </article>
            )
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <article className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold">Response Time SLA Trends</h1>
                <p className="text-xs text-slate-500">Real-time versus historical target of 5 minutes</p>
              </div>
              <span className="text-xl leading-none">⋮</span>
            </div>
            <AreaChart
              data={responseTrend}
              index="time"
              categories={["minutes", "target"]}
              colors={["lime", "red"]}
              showLegend={false}
              showYAxis={false}
              className="h-72"
            />
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold">Incident Category</h2>
            <div className="mt-5 grid gap-4">
              {categories.map((category) => (
                <div key={category.name}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{category.name}</span>
                    <span>{category.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#b8ec67]" style={{ width: `${category.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-7 w-full rounded-lg bg-[#d9f7bd] py-3 text-xs font-bold text-[#073f31]">View Full Inventory</button>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <article className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold">Recent Incident List</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {recentIncidents.map((incident) => (
                <a key={incident.id} href="/command-center/demo" className="grid gap-1 py-3 text-sm hover:text-primary">
                  <div className="flex items-center justify-between gap-3">
                    <span className={incident.urgency === "critical" ? "rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-600" : "rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-black uppercase text-yellow-700"}>
                      {incident.urgency}
                    </span>
                    <span className="text-xs text-slate-500">{incident.timeAgo}</span>
                  </div>
                  <p className="font-bold">{incident.title}</p>
                  <p className="text-xs text-slate-500">{incident.location}</p>
                </a>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold">System Logs</h2>
            <div className="mt-4 grid gap-4">
              {logs.map((log) => (
                <div key={log.message} className="grid grid-cols-[8px_1fr_auto] items-start gap-3 text-xs">
                  <span className="mt-1.5 size-2 rounded-full bg-primary" />
                  <p className="text-slate-700">{log.message}</p>
                  <span className="text-slate-400">{log.timeAgo}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
