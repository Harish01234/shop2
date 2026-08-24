import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AdminMigrationNav } from '#/features/admin/admin-migration-nav'
import { adminOverviewQueryOptions } from '#/features/admin/admin.queries'

export const Route = createFileRoute('/admin/migration')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminOverviewQueryOptions()),
  component: AdminMigrationLayout,
})

function AdminMigrationLayout() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Migration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload CSV files to import Jinis or JinisChara records.
        </p>
      </div>
      <AdminMigrationNav />
      <Outlet />
    </main>
  )
}
