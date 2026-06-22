import { Link } from "@tanstack/react-router"
import { UrgencyBadge } from "@/components/urgency-badge"
import { cn } from "@workspace/ui/lib/utils"

export interface IncidentRowProps {
  id: string
  title: string
  location: string
  urgency: "critical" | "high" | "medium" | "low"
  timeAgo: string
  href?: string
  /** "compact" = dashboard list style, "card" = incidents page card style */
  variant?: "compact" | "card"
  className?: string
}

export function IncidentRow({
  id,
  title,
  location,
  urgency,
  timeAgo,
  href = "/command-center/$incidentId",
  variant = "compact",
  className,
}: IncidentRowProps) {
  const to = href.includes("$incidentId") ? "/command-center/$incidentId" : href
  const params = to === "/command-center/$incidentId" ? { incidentId: id || "demo" } : {}

  if (variant === "card") {
    return (
      <Link
        to={to}
        params={params}
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted flex items-start gap-3",
          className,
        )}
      >
        <UrgencyBadge level={urgency} size="sm">
          {urgency}
        </UrgencyBadge>
        <div>
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{location}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{timeAgo}</span>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "flex items-start justify-between gap-3 py-4 text-sm transition-colors hover:text-primary",
        className,
      )}
    >
      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <UrgencyBadge level={urgency} size="sm">
            {urgency}
          </UrgencyBadge>
          <span className="text-xs text-muted-foreground">{location}</span>
        </div>
        <p className="font-bold leading-tight">{title}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
    </Link>
  )
}
