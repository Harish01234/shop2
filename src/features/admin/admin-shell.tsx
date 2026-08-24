import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import {
  BanknoteIcon,
  CalculatorIcon,
  DatabaseIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  ScaleIcon,
} from 'lucide-react'

import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

const adminNav = [
  {
    title: 'Dashboard',
    to: '/admin' as const,
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: 'Sessions',
    to: '/admin/sessions' as const,
    icon: MonitorIcon,
    exact: false,
  },
  {
    title: 'Interest',
    to: '/admin/interest' as const,
    icon: BanknoteIcon,
    exact: false,
  },
  {
    title: 'Daily Calculation',
    to: '/admin/daily-calculation' as const,
    icon: CalculatorIcon,
    exact: false,
  },
  {
    title: 'Main Calculation',
    to: '/admin/main-calculation' as const,
    icon: ScaleIcon,
    exact: false,
  },
  {
    title: 'Migration',
    to: '/admin/migration' as const,
    icon: DatabaseIcon,
    exact: false,
  },
  {
    title: 'Export',
    to: '/admin/export' as const,
    icon: DownloadIcon,
    exact: false,
  },
]

type AdminShellUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function AdminShell({ user }: { user: AdminShellUser }) {
  const matchRoute = useMatchRoute()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  render={<Link to="/" />}
                  tooltip="Home"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    I
                  </span>
                  <span className="font-heading text-sm font-medium">
                    Admin
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => {
                    const isActive = Boolean(
                      matchRoute({
                        to: item.to,
                        fuzzy: !item.exact,
                      }),
                    )

                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          render={<Link to={item.to} />}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/jinis" search={{ view: 'open' }} />}
                  tooltip="Jinis"
                >
                  <span>Jinis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/jinischara" search={{ view: 'open' }} />}
                  tooltip="JinisChara"
                >
                  <span>JinisChara</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <BetterAuthHeader user={user} />
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
