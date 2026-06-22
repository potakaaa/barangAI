import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"

export interface LogEntry {
  message: string
  timeAgo: string
  type?: "dispatch" | "system" | "alert"
}

export interface SystemLogFeedProps {
  entries: LogEntry[]
  /** "dotted" = dashboard style with bullet dot, "plain" = command center style */
  variant?: "dotted" | "plain"
  maxHeight?: string   // for ScrollArea — e.g. "200px"
  className?: string
}

export function SystemLogFeed({
  entries,
  variant = "dotted",
  maxHeight,
  className,
}: SystemLogFeedProps) {
  const content = (
    <div className={cn("grid gap-4 text-xs", variant === "plain" ? "text-muted-foreground" : "", className)}>
      {entries.map((log) =>
        variant === "dotted" ? (
          <div key={log.message} className="grid grid-cols-[8px_1fr_auto] items-start gap-3">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <p className="leading-snug text-foreground/80">{log.message}</p>
            <span className="shrink-0 text-muted-foreground">{log.timeAgo}</span>
          </div>
        ) : (
          <div key={log.message} className="flex items-start justify-between gap-4">
            <p>{log.message}</p>
            <span className="shrink-0">{log.timeAgo}</span>
          </div>
        )
      )}
    </div>
  )

  if (maxHeight) {
    return <ScrollArea style={{ maxHeight }}>{content}</ScrollArea>
  }

  return content
}
