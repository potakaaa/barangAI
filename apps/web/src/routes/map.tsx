import { createFileRoute } from "@tanstack/react-router"
import { Layers, LocateFixed, Minus, Plus, Siren } from "lucide-react"

import { LeafletMap } from "@/components/leaflet-map"
import { personnel } from "@/lib/mock-data"

export const Route = createFileRoute("/map")({ component: MapPage })

function MapPage() {
  return (
    <main className="relative h-full min-h-[calc(100svh-120px)] overflow-hidden bg-[#041f1c] text-[#073f31]">
      <div className="absolute inset-0"><LeafletMap /></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,210,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,210,.08)_1px,transparent_1px)] bg-[size:92px_92px]" />

      <button className="absolute right-6 top-5 z-[500] flex items-center gap-2 rounded-lg bg-[#003f32] px-5 py-3 text-sm font-bold text-white shadow-xl"><Siren className="size-4" />Emergency Dispatch</button>

      <div className="absolute bottom-24 left-6 z-[500] grid gap-2">
        {[Plus, Minus, LocateFixed, Layers].map((Icon) => <button key={Icon.displayName ?? Icon.name} className="grid size-10 place-items-center rounded-lg bg-white/90 shadow"><Icon className="size-5" /></button>)}
      </div>

      <aside className="absolute right-6 top-20 z-[500] w-[min(320px,calc(100vw-48px))] rounded-2xl bg-white/90 p-5 shadow-2xl backdrop-blur">
        <div className="mb-5 flex items-center justify-between"><h1 className="text-lg font-bold">Personnel & Units</h1><span className="rounded-full bg-[#c9f28a] px-3 py-1 text-[10px] font-black">3 Online</span></div>
        <div className="grid gap-4">
          {personnel.map((unit) => (
            <article key={unit.name} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-bold">{unit.name}</p><p className="mt-1 text-xs text-slate-500">{unit.location}</p></div>
                <span className={unit.status === "online" ? "size-2 rounded-full bg-green-600" : "size-2 rounded-full bg-red-600"} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                <span className="flex gap-1">{[0, 1, 2].map((dot) => <span key={dot} className="size-4 rounded-full bg-slate-300" />)}</span>
                <button className="text-sm font-semibold text-[#073f31]">{unit.action}</button>
              </div>
            </article>
          ))}
        </div>
        <button className="mt-28 w-full rounded-lg bg-white py-3 text-sm font-semibold shadow-sm">Manage All Teams</button>
      </aside>
    </main>
  )
}
