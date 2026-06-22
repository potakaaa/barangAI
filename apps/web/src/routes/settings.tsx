import { createFileRoute } from "@tanstack/react-router"

import { SectionCard } from "@/components/section-card"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Switch } from "@workspace/ui/components/switch"

export const Route = createFileRoute("/settings")({ component: Settings })

const notificationPrefs = [
  {
    label: "Critical incident alerts",
    description: "Push a notification when a critical incident is reported.",
    defaultOn: true,
  },
  {
    label: "SMS gateway warnings",
    description: "Notify when the SMS gateway heartbeat drops below threshold.",
    defaultOn: true,
  },
  {
    label: "Daily digest",
    description: "Receive a summary of barangay activity each morning.",
    defaultOn: false,
  },
]

const systemRows = [
  { label: "Active channel", value: "Telegram" },
  { label: "SMS gateway", value: "Semaphore — Stable (99.8%)" },
  { label: "Clustering job", value: "Running (every minute)" },
  { label: "Build", value: "Hackathon preview" },
]

function Settings() {
  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full max-w-3xl gap-6">
        <PageHeader
          title="Settings"
          description="Manage your profile, notifications, and system configuration."
        />

        {/* ── Profile ─────────────────────────────────────────────── */}
        <SectionCard title="Profile" description="Your account identity in the console.">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarFallback className="bg-lihok-accent text-sm font-bold text-lihok-ink">
                JD
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">Juan Dela Cruz</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Brgy. Captain
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Notification Preferences ────────────────────────────── */}
        <SectionCard
          title="Notification Preferences"
          description="Choose which alerts you receive."
        >
          <div className="grid divide-y divide-border">
            {notificationPrefs.map((pref) => (
              <div
                key={pref.label}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <Switch defaultChecked={pref.defaultOn} aria-label={pref.label} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── System ──────────────────────────────────────────────── */}
        <SectionCard title="System" description="Read-only runtime status.">
          <div className="grid divide-y divide-border">
            {systemRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  )
}
