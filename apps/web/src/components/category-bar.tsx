import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

export interface CategoryBarProps {
  name: string
  percentage: number
  className?: string
}

export function CategoryBar({ name, percentage, className }: CategoryBarProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{name}</span>
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5 bg-muted [&_[data-slot=progress-indicator]]:bg-lihok-accent"
      />
    </div>
  )
}
