import { cva  } from "class-variance-authority"
import type {VariantProps} from "class-variance-authority";
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

const urgencyVariants = cva(
  "font-black uppercase tracking-wide inline-flex items-center justify-center",
  {
    variants: {
      level: {
        critical: "bg-urgency-critical/10 text-urgency-critical hover:bg-urgency-critical/20",
        high: "bg-urgency-high/10 text-urgency-high hover:bg-urgency-high/20",
        medium: "bg-urgency-medium/10 text-urgency-medium hover:bg-urgency-medium/20",
        low: "bg-urgency-low/10 text-urgency-low hover:bg-urgency-low/20",
        online: "bg-status-verified/20 text-lihok-ink hover:bg-status-verified/30",
        offline: "bg-urgency-critical/20 text-urgency-critical hover:bg-urgency-critical/30",
        busy: "bg-urgency-high/20 text-urgency-high hover:bg-urgency-high/30",
      },
      shape: {
        pill: "rounded-full",
        dot: "rounded-full p-0 flex-shrink-0",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
        dot: "size-2",
      },
    },
    defaultVariants: {
      level: "low",
      shape: "pill",
      size: "sm",
    },
  }
)

export interface UrgencyBadgeProps extends VariantProps<typeof urgencyVariants> {
  children?: React.ReactNode
  className?: string
}

export function UrgencyBadge({ level, shape, size, children, className }: UrgencyBadgeProps) {
  // If no children and shape is dot, don't render badge text logic, just a span that acts as a badge
  if (shape === "dot") {
    return (
      <span
        className={cn(urgencyVariants({ level, shape, size: "dot" }), className)}
        aria-hidden="true"
      />
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        urgencyVariants({ level, shape, size }),
        className
      )}
    >
      {children}
    </Badge>
  )
}
