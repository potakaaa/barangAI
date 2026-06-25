import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { cn } from "@workspace/ui/lib/utils"
import type { SmsReportStatus as SmsStatus } from "@/lib/types"

export interface SmsEntry {
  timestamp: string
  origin: string
  content: string
  status: SmsStatus
}

export interface SmsFeedTableProps {
  entries: SmsEntry[]
  className?: string
}

const statusVariant: Record<SmsStatus, string> = {
  verified: "bg-status-verified/20 text-lihok-ink",
  processing: "bg-status-processing/20 text-urgency-medium",
  pending: "bg-muted text-muted-foreground",
}

export function SmsFeedTable({ entries, className }: SmsFeedTableProps) {
  return (
    <ScrollArea className={cn("rounded-lg border border-border", className)}>
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Timestamp</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Message Content</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((sms) => (
            <TableRow key={sms.timestamp}>
              <TableCell className="font-medium">{sms.timestamp}</TableCell>
              <TableCell className="font-bold">{sms.origin}</TableCell>
              <TableCell className="text-foreground/80">{sms.content}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded px-2 py-1 text-[10px] font-black uppercase",
                    statusVariant[sms.status] || statusVariant.processing,
                  )}
                >
                  {sms.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
