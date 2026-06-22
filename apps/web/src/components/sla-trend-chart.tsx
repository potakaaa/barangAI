import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import type { ChartConfig } from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

const chartConfig = {
  minutes: { label: "Response (mins)", color: "var(--chart-1)" },
  target: { label: "Target", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export interface SlaTrendChartProps {
  data: { time: string; minutes: number; target: number }[]
  className?: string
}

export function SlaTrendChart({ data, className }: SlaTrendChartProps) {
  return (
    <ChartContainer config={chartConfig} className={cn("h-72 w-full", className)}>
      <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="sla-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-minutes)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-minutes)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="minutes"
          type="monotone"
          stroke="var(--color-minutes)"
          strokeWidth={2}
          fill="url(#sla-fill)"
        />
        <Line
          dataKey="target"
          type="monotone"
          stroke="var(--color-target)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
