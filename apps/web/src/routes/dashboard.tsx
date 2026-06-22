import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"

import {
  activePatrols,
  categories,
  dispatchEfficiency,
  logs,
  recentIncidents,
  responseTrend,
  stats,
  totalIncidentsSparkline,
} from "@/lib/mock-data"
import { StatCard } from "@/components/stat-card"
import type { StatCardVariant } from "@/components/stat-card"
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { IncidentRow } from "@/components/incident-row"
import { SystemLogFeed } from "@/components/system-log-feed"
import { SlaTrendChart } from "@/components/sla-trend-chart"
import { CardMenu } from "@/components/card-menu"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

const statIcons = [Clock, AlertTriangle, Activity, Radio]
const statVariants: StatCardVariant[] = ["trend", "sparkline", "progressCheck", "pills"]

function Dashboard() {
  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-5">

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const variant = statVariants[index] ?? "trend"
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={
                  variant === "pills"
                    ? activePatrols.active
                    : variant === "progressCheck"
                      ? dispatchEfficiency.value
                      : stat.value
                }
                unit={stat.unit}
                trend={variant === "pills" ? undefined : stat.trend}
                good={stat.good}
                icon={statIcons[index] ?? Activity}
                variant={variant}
                progress={variant === "progressCheck" ? dispatchEfficiency.value : 85}
                sparkline={variant === "sparkline" ? totalIncidentsSparkline : undefined}
                pills={variant === "pills" ? activePatrols.teams : undefined}
                fraction={variant === "pills" ? { total: activePatrols.total } : undefined}
              />
            )
          })}
        </section>

        {/* ── SLA chart + Categories ──────────────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            description="Real-time average historical target of 5 minutes"
            action={<CardMenu />}
          >
            <SlaTrendChart data={responseTrend} className="mt-2" />
          </SectionCard>

          {/* Incident Categories */}
          <SectionCard title="Incident Category">
            <div className="grid gap-4 mt-2">
              {categories.map((category) => (
                <CategoryBar
                  key={category.name}
                  name={category.name}
                  percentage={category.percentage}
                />
              ))}
            </div>
            <Button className="mt-7 w-full bg-lihok-accent/30 py-6 text-xs font-bold text-lihok-ink hover:bg-lihok-accent/50 hover:text-lihok-ink">
              View Full Inventory
            </Button>
          </SectionCard>
        </section>

        {/* ── Recent Incidents + System Logs ──────────────────────── */}
        <section className="grid gap-5 xl:grid-cols-[2fr_0.8fr]">
          {/* Recent Incidents List */}
          <SectionCard title="Recent Incident List" action={<CardMenu />}>
            <div className="grid divide-y divide-border">
              {recentIncidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  id={incident.id}
                  title={incident.title}
                  location={incident.location}
                  urgency={incident.urgency as "critical" | "high" | "medium" | "low"}
                  timeAgo={incident.timeAgo}
                />
              ))}
            </div>
          </SectionCard>

          {/* System Logs */}
          <SectionCard title="System Logs" action={<CardMenu />}>
            <SystemLogFeed entries={logs} variant="dotted" />
          </SectionCard>
        </section>
      </div>
    </main>
  )
}
