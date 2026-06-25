import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import type { PersonnelStatus } from "@/lib/types"
export type PersonnelAction = "Deploy" | "Re-assign" | "Message"

export interface PersonnelCardProps {
  name: string
  location: string
  status: PersonnelStatus
  action: PersonnelAction
  onAction?: () => void
  className?: string
}

const statusConfig: Record<PersonnelStatus, { dot: string; label: string }> = {
  online: { dot: "bg-status-verified", label: "Online" },
  busy: { dot: "bg-urgency-high", label: "Busy" },
  offline: { dot: "bg-urgency-critical", label: "Offline" },
}

export function PersonnelCard({
  name,
  location,
  status,
  action,
  onAction,
  className,
}: PersonnelCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const config = statusConfig[status] || { dot: "bg-muted-foreground", label: "Unknown" }

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-sm">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{location}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", config.dot)} />
            </TooltipTrigger>
            <TooltipContent>{config.label}</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="flex gap-1">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-4 rounded-full bg-muted" />
            ))}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold text-lihok-ink hover:text-primary"
            onClick={onAction}
          >
            {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
