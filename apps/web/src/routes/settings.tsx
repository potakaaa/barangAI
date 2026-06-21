import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/settings")({ component: Settings })

function Settings() {
  return <main className="min-h-full bg-[#f5f7f8] p-8 text-[#073f31]"><h1 className="text-2xl font-black tracking-[-0.04em]">Settings</h1><p className="mt-2 text-slate-500">UI placeholder for the hackathon build.</p></main>
}
