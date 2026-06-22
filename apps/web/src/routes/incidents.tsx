import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { recentIncidents } from "@/lib/mock-data"
import { IncidentRow } from "@/components/incident-row"
import { PageHeader } from "@/components/page-header"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/incidents")({ component: Incidents })

type Urgency = "critical" | "high" | "medium" | "low"
type Filter = "all" | Urgency

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

function Incidents() {
  const [filter, setFilter] = useState<Filter>("all")

  const visible = useMemo(
    () =>
      filter === "all"
        ? recentIncidents
        : recentIncidents.filter((incident) => incident.urgency === filter),
    [filter],
  )

  return (
    <main className="min-h-full bg-lihok-surface p-4 text-lihok-ink lg:p-8">
      <div className="grid w-full gap-6">
        <PageHeader
          title="Incidents"
          action={
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => {
                if (v) setFilter(v as Filter)
              }}
              className="flex-wrap rounded-md border border-border bg-card p-1 text-xs font-bold"
              aria-label="Filter incidents by urgency"
            >
              {FILTERS.map((f) => (
                <ToggleGroupItem
                  key={f.value}
                  value={f.value}
                  aria-label={f.label}
                  className={cn(
                    "rounded px-4 py-2 text-muted-foreground data-[state=on]:bg-lihok-accent/40 data-[state=on]:text-lihok-ink",
                  )}
                >
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
        />

        {visible.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((incident) => (
              <IncidentRow
                key={incident.id}
                id={incident.id}
                title={incident.title}
                location={incident.location}
                urgency={incident.urgency as Urgency}
                timeAgo={incident.timeAgo}
                variant="card"
              />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/70 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">No incidents found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No incidents match the selected urgency. Try a different filter.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
