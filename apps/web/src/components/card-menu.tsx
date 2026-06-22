import { MoreVertical } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function CardMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-muted-foreground outline-none transition-colors hover:text-foreground">
        <MoreVertical className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Export</DropdownMenuItem>
        <DropdownMenuItem>Refresh</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
