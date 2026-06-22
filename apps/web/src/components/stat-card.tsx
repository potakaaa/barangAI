import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"
import { TotalIncidentsSparkline } from "@/components/total-incidents-sparkline"

export type StatCardVariant = "trend" | "sparkline" | "progressCheck" | "pills"

export interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: string
  good?: boolean
  icon?: LucideIcon
  progress?: number
  variant?: StatCardVariant
  /** sparkline variant — bar series */
  sparkline?: number[]
  /** pills variant — team badges (e.g. P1/P2/P3/+39) */
  pills?: string[]
  /** pills variant — denominator shown as value/total */
  fraction?: { total: number }
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  good = true,
  icon: Icon,
  progress = 75,
  variant = "trend",
  sparkline,
  pills,
  fraction,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-transform hover:-translate-y-0.5 shadow-sm border-border bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-0">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </CardTitle>
        {variant === "progressCheck" ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : (
          Icon && <Icon className="size-4 text-primary" />
        )}
      </CardHeader>
      <CardContent className="p-5 pt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-[-0.06em] text-foreground">
            {value}
          </span>
          {fraction && (
            <span className="text-sm font-semibold text-muted-foreground">
              /{fraction.total}
            </span>
          )}
          {unit && (
            <span className="text-sm font-semibold text-muted-foreground">
              {unit}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "ml-2 text-xs font-bold",
                good ? "text-primary" : "text-urgency-critical"
              )}
            >
              {trend}
            </span>
          )}
        </div>

        {variant === "sparkline" && sparkline ? (
          <div className="mt-3">
            <TotalIncidentsSparkline data={sparkline} />
          </div>
        ) : variant === "pills" && pills ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pills.map((pill) => (
              <Badge
                key={pill}
                variant="secondary"
                className="bg-lihok-accent/40 text-[11px] font-bold text-lihok-ink"
              >
                {pill}
              </Badge>
            ))}
          </div>
        ) : (
          <Progress
            value={progress}
            className="mt-4 h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-lihok-accent"
          />
        )}
      </CardContent>
    </Card>
  )
}
