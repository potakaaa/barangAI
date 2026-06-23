import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Send, Share2 } from "lucide-react"

import { getIncidentById, getSmsReportsByIncident, getSystemLogsByIncident } from "@/lib/queries"
import { useRealtimeTable } from "@/hooks/use-realtime"
import { AiUrgencyPanel } from "@/components/ai-urgency-panel"
import { BroadcastForm } from "@/components/broadcast-form"
import { SectionCard } from "@/components/section-card"
import { SmsFeedTable } from "@/components/sms-feed-table"
import type { SmsEntry } from "@/components/sms-feed-table"
import { SystemLogFeed } from "@/components/system-log-feed"
import { UrgencyBadge } from "@/components/urgency-badge"
import { Button } from "@workspace/ui/components/button"
import type { SmsReport, SystemLog } from "@/lib/types"

export const Route = createFileRoute("/command-center/$incidentId")({
  component: CommandCenter,
})

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function IncidentDetailLoading() {
  return (
    <main className="flex min-h-full items-center justify-center bg-lihok-surface p-4 text-lihok-ink">
      <p className="text-sm text-muted-foreground">Loading incident...</p>
    </main>
  )
}

function IncidentNotFound({ id }: { id: string }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-lihok-surface p-4 text-lihok-ink">
      <div className="text-center">
        <p className="text-lg font-bold">Incident not found</p>
        <p className="mt-1 text-sm text-muted-foreground">No incident with ID &quot;{id}&quot; was found.</p>
      </div>
    </main>
  )
}

function IncidentError({ message }: { message: string }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-lihok-surface p-4 text-lihok-ink">
      <div className="text-center">
        <p className="text-lg font-bold">Error loading incident</p>
        <p className="mt-1 text-sm text-urgency-critical">{message}</p>
      </div>
    </main>
  )
}

function CommandCenter() {
  const { incidentId } = Route.useParams()
  const [incident, setIncident] = useState<any>(null)
  const [smsReports, setSmsReports] = useState<SmsReport[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const liveSms = useRealtimeTable("sms_reports", smsReports)
  const liveLogs = useRealtimeTable("system_logs", systemLogs)

  useEffect(() => {
    async function load() {
      try {
        const [inc, sms, logs] = await Promise.all([
          getIncidentById(incidentId),
          getSmsReportsByIncident(incidentId),
          getSystemLogsByIncident(incidentId),
        ])
        if (!inc) {
          setError("NOT_FOUND")
          return
        }
        setIncident(inc)
        setSmsReports(sms)
        setSystemLogs(logs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load incident")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [incidentId])

  if (loading) return <IncidentDetailLoading />
  if (error === "NOT_FOUND") return <IncidentNotFound id={incidentId} />
  if (error) return <IncidentError message={error} />
  if (!incident) return <IncidentNotFound id={incidentId} />

  const smsEntries: SmsEntry[] = liveSms.map((s) => ({
    timestamp: formatTimeAgo(s.created_at),
    origin: s.sender_number,
    content: s.content,
    status: s.status,
  }))

  const logEntries = liveLogs.map((l) => ({
    message: l.message,
    timeAgo: formatTimeAgo(l.created_at),
  }))

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard>
          <div className="border-t-4 border-primary pt-6">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs">
              <UrgencyBadge level={incident.urgency ?? "low"} size="md">
                {incident.urgency ?? "Unknown"}
              </UrgencyBadge>
              <span className="text-muted-foreground">{incident.location_name ?? incident.location_zone ?? "Unknown"}</span>
              <span className="ml-auto rounded-lg bg-lihok-accent/40 px-4 py-2 font-bold text-lihok-ink">
                {liveSms.length} Linked Reports
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">{incident.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Incident ID: {incidentId}</p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
            <div
              className="min-h-44 rounded-lg bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(7,63,49,.25),rgba(7,63,49,.75)), url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=700&q=80')",
              }}
            />
            <div className="rounded-lg border border-border bg-muted p-5 text-sm leading-7 text-foreground/80">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current Condition</p>
              {incident.title}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3 border-b border-border pb-5">
            <Button variant="emergency" className="flex h-11 items-center gap-2 px-5 text-sm font-bold transition-opacity hover:opacity-90">
              <Send className="size-4" />Dispatch Response Team
            </Button>
            <Button variant="outline" size="icon" className="size-11 border-border transition-colors hover:bg-muted">
              <Share2 className="size-4" />
            </Button>
          </div>
          <div className="mt-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">Raw SMS Feed</h2>
            <SmsFeedTable entries={smsEntries} />
          </div>
        </SectionCard>
        <aside className="grid content-start gap-5">
          <AiUrgencyPanel score={98} reasoning="Report volume, keyword analysis, and nearby historical flood data indicate immediate intervention." />
          <BroadcastForm incidentId={incidentId} defaultMessage={`Alert: ${incident.title}`} onSend={async (msg) => { console.log("Sending broadcast:", msg); await new Promise((resolve) => setTimeout(resolve, 1000)); }} />
          <SectionCard title={<span className="text-xs font-black uppercase tracking-wide text-muted-foreground">System Log</span>} variant="dashed">
            <SystemLogFeed entries={logEntries} variant="plain" />
          </SectionCard>
        </aside>
      </div>
    </main>
  )
}
