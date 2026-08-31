import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AdminMigrationNav } from '#/features/admin/admin-migration-nav'
import {
  AdminMigrationDateFormatField,
  MigrationCsvDateOrderProvider,
  useMigrationCsvDateOrder,
} from '#/features/admin/component/admin-migration-date-format-field'
import { adminOverviewQueryOptions } from '#/features/admin/admin.queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/admin/migration')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminOverviewQueryOptions()),
  component: AdminMigrationLayout,
})

function AdminMigrationLayout() {
  return (
    <MigrationCsvDateOrderProvider>
      <AdminMigrationLayoutContent />
    </MigrationCsvDateOrderProvider>
  )
}

function AdminMigrationLayoutContent() {
  const { dateOrder, setDateOrder } = useMigrationCsvDateOrder()

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

      <Card className="max-w-xl border-primary/20 bg-muted/20">
        <CardHeader>
          <CardTitle>CSV date format</CardTitle>
          <CardDescription>
            Choose how dates are written in your file. Use Month / Day / Year
            for US-style dates like 08/25/2026.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminMigrationDateFormatField
            value={dateOrder}
            onValueChange={setDateOrder}
          />
        </CardContent>
      </Card>

      <AdminMigrationNav />
      <Outlet />
    </main>
  )
}
