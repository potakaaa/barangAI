import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, AlertTriangle, Clock, Radio } from "lucide-react"

import {
  activePatrols,
  categories,
  dispatchEfficiency,
  heatZones,
  responseTrend,
  stats,
  totalIncidentsSparkline,
} from "@/lib/mock-data"
import { StatCard } from "@/components/stat-card"
import type { StatCardVariant } from "@/components/stat-card"
import { CategoryBar } from "@/components/category-bar"
import { SectionCard } from "@/components/section-card"
import { PageHeader } from "@/components/page-header"
import { CardMenu } from "@/components/card-menu"
import { SlaTrendChart } from "@/components/sla-trend-chart"
import { TimeRangeToggle } from "@/components/time-range-toggle"
import type { TimeRange } from "@/components/time-range-toggle"
import { HeatZoneCell } from "@/components/heat-zone-cell"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/reports")({ component: Reports })

const statIcons = [Clock, AlertTriangle, Activity, Radio]
const statVariants: StatCardVariant[] = ["trend", "sparkline", "progressCheck", "pills"]

function Reports() {
  const [range, setRange] = useState<TimeRange>("24H")

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-6">

        {/* ── Page header + time range toggle ──────────────────────── */}
        <PageHeader
          title="Analytics Performance"
          description="Real-time monitoring of barangay response metrics and safety trends."
          action={<TimeRangeToggle value={range} onChange={setRange} />}
        />

        {/* ── Stat cards ───────────────────────────────────────────── */}
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

        {/* ── SLA chart + Categories ────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <SectionCard
            title={<span className="text-lg font-bold">Response Time SLA Trends</span>}
            description="Real-time versus historical target of 5 minutes"
            action={<CardMenu />}
          >
            <SlaTrendChart data={responseTrend} className="mt-2" />
          </SectionCard>

          <SectionCard
            title="Incident Categories"
            description="Breakdown by type"
            action={<CardMenu />}
          >
            <div className="grid gap-4">
              {categories.slice(1).map((category) => (
                <CategoryBar
                  key={category.name}
                  name={category.name}
                  percentage={category.percentage}
                />
              ))}
            </div>
            <Button variant="secondary" className="mt-7 w-full py-6 text-xs font-bold hover:bg-lihok-accent/30 hover:text-lihok-ink">
              Download Category Report
            </Button>
          </SectionCard>
        </div>

        {/* ── Purok Heat Map ────────────────────────────────────────── */}
        <SectionCard
          title="Purok Heat Map"
          description="High density zones requiring immediate resource allocation"
          action={<CardMenu />}
        >
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {heatZones.map((zone) => (
              <HeatZoneCell
                key={zone.zone}
                zone={zone.zone}
                label={zone.label}
                density={zone.density}
                wideOnMd={zone.wideOnMd}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  )
}
