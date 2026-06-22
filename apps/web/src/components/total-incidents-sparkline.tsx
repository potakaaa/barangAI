import { Bar, BarChart } from "recharts"

import { ChartContainer } from "@workspace/ui/components/chart"
import type { ChartConfig } from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

const chartConfig = {
  value: { label: "Incidents", color: "var(--chart-2)" },
} satisfies ChartConfig

export interface TotalIncidentsSparklineProps {
  data: number[]
  className?: string
}

export function TotalIncidentsSparkline({
  data,
  className,
}: TotalIncidentsSparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("h-12 w-full", className)}
    >
      <BarChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="value" fill="var(--color-value)" radius={2} />
      </BarChart>
    </ChartContainer>
  )
}
