import { Link, createFileRoute } from '@tanstack/react-router'
import {
  BanknoteIcon,
  DatabaseIcon,
  DownloadIcon,
  IndianRupeeIcon,
  MonitorIcon,
  UsersIcon,
} from 'lucide-react'

import { useAdminOverview } from '#/features/admin/admin.hooks'
import { adminOverviewQueryOptions } from '#/features/admin/admin.queries'
import { useTotalInterest } from '#/features/interest/interest.hooks'
import { totalInterestQueryOptions } from '#/features/interest/interest.queries'
import { useActiveJinisTotal } from '#/features/jinis/jinis.hooks'
import { activeJinisTotalQueryOptions } from '#/features/jinis/jinis.queries'
import { formatJinisCredit } from '#/features/jinis/jinis.utils'
import { useActiveJinisCharaTotal } from '#/features/jinischara/jinischara.hooks'
import { activeJinisCharaTotalQueryOptions } from '#/features/jinischara/jinischara.queries'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQueryOptions()),
      context.queryClient.ensureQueryData(activeJinisTotalQueryOptions()),
      context.queryClient.ensureQueryData(activeJinisCharaTotalQueryOptions()),
      context.queryClient.ensureQueryData(totalInterestQueryOptions()),
    ]),
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const overviewQuery = useAdminOverview()
  const activeTotalQuery = useActiveJinisTotal()
  const activeCharaTotalQuery = useActiveJinisCharaTotal()
  const totalInterestQuery = useTotalInterest()
  const data = overviewQuery.data

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of users, sessions, Jinis, and JinisChara.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Users"
          value={data?.userCount}
          icon={UsersIcon}
          loading={overviewQuery.isPending}
        />
        <StatCard
          title="Active sessions"
          value={data?.activeSessionCount}
          icon={MonitorIcon}
          loading={overviewQuery.isPending}
        />
        <StatCard
          title="Jinis"
          value={data?.jinisCount}
          icon={DatabaseIcon}
          loading={overviewQuery.isPending}
        />
        <StatCard
          title="Total Active Jinis Credit"
          value={activeTotalQuery.data}
          icon={IndianRupeeIcon}
          loading={activeTotalQuery.isPending}
          format="inr"
        />
        <StatCard
          title="Total Active JinisChara Credit"
          value={activeCharaTotalQuery.data}
          icon={IndianRupeeIcon}
          loading={activeCharaTotalQuery.isPending}
          format="inr"
        />
        <StatCard
          title="Total Interest Collected"
          value={totalInterestQuery.data}
          icon={BanknoteIcon}
          loading={totalInterestQuery.isPending}
          format="inr"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest login sessions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {overviewQuery.isPending ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : data?.recentSessions.length ? (
              data.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {session.userName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.userEmail}
                    </p>
                  </div>
                  <Badge variant={session.active ? 'default' : 'secondary'}>
                    {session.active ? 'Active' : 'Expired'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Open other admin pages.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              to="/admin/interest"
              search={{ source: 'all' }}
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
            >
              <BanknoteIcon />
              Interest
            </Link>
            <Link
              to="/admin/sessions"
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
            >
              <MonitorIcon />
              Sessions
            </Link>
            <Link
              to="/admin/migration"
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
            >
              <DatabaseIcon />
              Migration
            </Link>
            <Link
              to="/admin/export"
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
            >
              <DownloadIcon />
              Export
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  format = 'integer',
}: {
  title: string
  value?: number
  icon: typeof UsersIcon
  loading: boolean
  format?: 'integer' | 'inr'
}) {
  const display =
    format === 'inr'
      ? formatJinisCredit(value ?? 0)
      : String(value ?? 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="font-heading text-2xl font-medium">{display}</p>
        )}
      </CardContent>
    </Card>
  )
}
