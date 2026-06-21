import { createFileRoute } from "@tanstack/react-router"
import { Brain, Megaphone, Send, Share2 } from "lucide-react"

import { logs, smsFeed } from "@/lib/mock-data"

export const Route = createFileRoute("/command-center/$incidentId")({ component: CommandCenter })

function CommandCenter() {
  const { incidentId } = Route.useParams()

  return (
    <main className="min-h-full bg-[#f5f7f8] p-4 text-[#073f31] lg:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="border-t-4 border-[#073f31] pt-6">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-red-50 px-3 py-1 font-black uppercase text-red-600">Critical</span>
              <span className="text-slate-500">Doryduman, Zone 4</span>
              <span className="ml-auto rounded-lg bg-[#c9f28a] px-4 py-2 font-bold">5 Linked Reports</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">Flooding Cluster: Zone 4</h1>
            <p className="mt-1 text-xs text-slate-500">Incident ID: {incidentId}</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
            <div className="min-h-44 rounded-lg bg-[linear-gradient(rgba(7,63,49,.25),rgba(7,63,49,.75)),url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=700&q=80')] bg-cover bg-center" />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Condition</p>
              Rising water levels observed at the intersection of Main St and 4th Ave. Multiple resident reports confirm drainage failure.
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-b border-slate-200 pb-5">
            <button className="flex items-center gap-2 rounded-lg bg-[#004031] px-5 py-3 text-sm font-bold text-white"><Send className="size-4" />Dispatch Response Team</button>
            <button className="grid size-11 place-items-center rounded-lg border border-slate-200"><Share2 className="size-4" /></button>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">Raw SMS Feed</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr><th className="p-4">Timestamp</th><th className="p-4">Origin</th><th className="p-4">Message Content</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {smsFeed.map((sms) => (
                    <tr key={sms.timestamp}>
                      <td className="p-4 font-medium">{sms.timestamp}</td>
                      <td className="p-4 font-bold">{sms.origin}</td>
                      <td className="p-4 text-slate-700">{sms.content}</td>
                      <td className="p-4"><span className={sms.status === "verified" ? "rounded bg-[#c9f28a] px-2 py-1 text-[10px] font-black uppercase" : "rounded bg-yellow-100 px-2 py-1 text-[10px] font-black uppercase text-yellow-700"}>{sms.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><Brain className="size-5" />AI Urgency Score</h2><span className="rounded bg-[#004031] px-3 py-2 text-xs font-bold text-white">Real-time</span></div>
            <p className="mt-5 text-6xl font-black tracking-[-0.08em]">98<span className="text-sm text-slate-500"> / 100</span></p>
            <div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-full w-[98%] rounded-full bg-[#004031]" /></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Report volume, keyword analysis, and nearby historical flood data indicate immediate intervention.</p>
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone className="size-5" />Citizen Update Loop</h2>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-500">Broadcast Message</label>
            <textarea className="mt-2 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm" defaultValue="Alert: Zone 4 residents, please avoid the main intersection..." />
            <button className="mt-4 w-full rounded-lg bg-[#c9f28a] px-5 py-3 text-sm font-black">Send Alert</button>
          </section>

          <section className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wide text-slate-500">System Log</h2>
            <div className="mt-4 grid gap-4 text-xs text-slate-500">
              {logs.map((log) => <p key={log.message}>{log.message} <span className="float-right">{log.timeAgo}</span></p>)}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
