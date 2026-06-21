import { Link, useRouterState } from "@tanstack/react-router"
import { useState } from "react"
import {
  AlertTriangle,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Radio,
  Search,
  Settings,
} from "lucide-react"

import { logs } from "@/lib/mock-data"
import { TopBarSearch } from "@/components/top-bar-search"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/command-center/demo", label: "Command Center", icon: Radio },
  { href: "/map", label: "Map", icon: Map },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const latestLog = logs[0] ?? { message: "System nominal", timeAgo: "" }
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className={cn(
      "grid h-svh grid-cols-1 bg-lihok-surface text-lihok-ink transition-[grid-template-columns] duration-300",
      isSidebarOpen ? "lg:grid-cols-[244px_1fr]" : "lg:grid-cols-[80px_1fr]"
    )}>
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
        {/* Logo */}
        <div 
          className={cn("flex h-20 cursor-pointer items-center gap-3 px-6 transition-all", !isSidebarOpen && "px-0 justify-center")}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Radio className="size-5" />
          </span>
          {isSidebarOpen && (
            <div className="animate-in fade-in zoom-in duration-300">
              <p className="text-xl font-black tracking-[-0.04em]">LihokBarangAI</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Admin Console
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-4 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const section = `/${item.href.split("/")[1]}`
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(section))

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-lihok-ink",
                  isSidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3 px-0",
                  active && "bg-lihok-accent/40 font-semibold text-lihok-ink",
                  active && isSidebarOpen && "border-l-4 border-primary"
                )}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className={cn("border-t border-border p-5", !isSidebarOpen && "flex flex-col items-center px-2")}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lihok-accent text-sm font-bold text-lihok-ink">
              JD
            </span>
            {isSidebarOpen && (
              <div className="animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-semibold">Juan Dela Cruz</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Brgy. Captain
                </p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn(
              "mt-5 text-muted-foreground hover:bg-transparent hover:text-foreground",
              isSidebarOpen ? "w-full justify-start gap-3 px-0" : "w-10 justify-center px-0"
            )}
            title={!isSidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="size-4 shrink-0" /> 
            {isSidebarOpen && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="grid h-svh grid-rows-[auto_1fr_64px] overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <TopBarSearch />
            <div className="flex items-center gap-4 text-muted-foreground">
              <Bell className="size-5" />
              <span className="grid size-7 place-items-center rounded-full border border-border text-xs font-semibold lg:hidden">
                JD
              </span>
            </div>
          </div>

          {/* Mobile nav strip */}
          <nav className="mt-3 flex w-full gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const active = pathname.startsWith(`/${item.href.split("/")[1]}`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-1 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors",
                    active && "bg-lihok-accent/40 text-lihok-ink",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        {/* Page content */}
        <div className="overflow-auto">{children}</div>

        {/* Live alert bar */}
        <footer
          className="flex items-center gap-4 border-t border-border bg-card px-4 text-sm lg:px-8"
          aria-live="polite"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-live-alert-bg text-live-alert">
            <Radio className="size-4 animate-[live-pulse_2s_ease-in-out_infinite]" />
          </span>
          <div className="min-w-28 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-live-alert">
              Live Alerts
            </p>
            <p className="font-semibold text-lihok-ink">Feed Active</p>
          </div>
          <p className="truncate text-muted-foreground">{latestLog.message}</p>
          <span className="ml-auto hidden shrink-0 text-muted-foreground sm:block">13:58</span>
        </footer>
      </div>
    </div>
  )
}
