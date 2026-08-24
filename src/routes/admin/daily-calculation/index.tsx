import { useCallback, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'

import { AdvanceSearchFilter } from '#/features/dailycalculation/component/AdvanceSearchFilter'
import { DailyCalculationModal } from '#/features/dailycalculation/component/dailycalculation-modal'
import { DailyCalculationTable } from '#/features/dailycalculation/component/dailycalculation-table'
import {
  filtersFromSearch,
  type DailyCalculationFilterValues,
} from '#/features/dailycalculation/dailycalculation.filters'
import {
  useCloseDailyCalculation,
  useDailyCalculationList,
  useDeleteDailyCalculation,
} from '#/features/dailycalculation/dailycalculation.hooks'
import {
  dailyCalculationKeys,
  dailyCalculationListQueryOptions,
} from '#/features/dailycalculation/dailycalculation.queries'
import type {
  DailyCalculationRecord,
  DailyCalculationView,
} from '#/features/dailycalculation/dailycalculation.types'
import { formatPeriodLabel } from '#/features/dailycalculation/dailycalculation.utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { ListPagination } from '@/components/list-pagination'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/daily-calculation/')({
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const filters = filtersFromSearch(deps)
    return context.queryClient.ensureQueryData(
      dailyCalculationListQueryOptions(deps.view, filters, deps.page),
    )
  },
  pendingComponent: DailyCalculationListPending,
  errorComponent: DailyCalculationListError,
  component: AdminDailyCalculationPage,
})

function DailyCalculationListPending() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}

function DailyCalculationListError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const queryClient = useQueryClient()

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Could not load Daily Calculation</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <div>
        <Button
          type="button"
          onClick={() => {
            void queryClient.invalidateQueries({
              queryKey: dailyCalculationKeys.all,
            })
            reset()
          }}
        >
          Try again
        </Button>
      </div>
    </main>
  )
}

function AdminDailyCalculationPage() {
  const search = Route.useSearch()
  const currentView: DailyCalculationView = search.view
  const filters = filtersFromSearch(search)
  const page = search.page ?? 1
  const navigate = useNavigate({ from: '/admin/daily-calculation/' })
  const listQuery = useDailyCalculationList(currentView, filters, page)
  const deleteMutation = useDeleteDailyCalculation()
  const closeMutation = useCloseDailyCalculation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    DailyCalculationRecord | undefined
  >()
  const [deleteTarget, setDeleteTarget] = useState<DailyCalculationRecord | null>(
    null,
  )
  const [closeTarget, setCloseTarget] = useState<DailyCalculationRecord | null>(
    null,
  )

  const records = listQuery.data?.records ?? []

  const handleFiltersChange = useCallback(
    (nextFilters: DailyCalculationFilterValues) => {
      void navigate({
        replace: true,
        search: {
          view: currentView,
          ...nextFilters,
          page: 1,
        },
      })
    },
    [currentView, navigate],
  )

  function openCreateModal() {
    setEditingRecord(undefined)
    setModalOpen(true)
  }

  function openEditModal(record: DailyCalculationRecord) {
    setEditingRecord(record)
    setModalOpen(true)
  }

  function openDetailPage(record: DailyCalculationRecord) {
    void navigate({
      to: '/admin/daily-calculation/$id/detail',
      params: { id: record.id },
      search: (prev) => prev,
    })
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync(deleteTarget)
      setDeleteTarget(null)
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  async function confirmClose() {
    if (!closeTarget) return

    try {
      await closeMutation.mutateAsync({ id: closeTarget.id })
      setCloseTarget(null)
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">
            Daily Calculation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Period totals for Tabil, Asol, Sudh, Deoya, and cash on hand.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create Daily Calculation
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          to="/admin/daily-calculation"
          search={(prev) => ({ ...prev, view: 'open', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'open' ? 'default' : 'ghost',
            }),
          )}
        >
          Open
        </Link>
        <Link
          to="/admin/daily-calculation"
          search={(prev) => ({ ...prev, view: 'closed', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'closed' ? 'default' : 'ghost',
            }),
          )}
        >
          Closed
        </Link>
        <Link
          to="/admin/daily-calculation"
          search={(prev) => ({ ...prev, view: 'all', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'all' ? 'default' : 'ghost',
            }),
          )}
        >
          All
        </Link>
      </div>

      <AdvanceSearchFilter
        filters={filters}
        onChange={handleFiltersChange}
        totalCount={listQuery.data?.total ?? 0}
      />

      {listQuery.isError && records.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load Daily Calculation</AlertTitle>
          <AlertDescription>{listQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <DailyCalculationTable
        records={records}
        onCreate={openCreateModal}
        onView={openDetailPage}
        onEdit={openEditModal}
        onClose={setCloseTarget}
        onDelete={setDeleteTarget}
        closingId={closeMutation.isPending ? closeTarget?.id : null}
      />

      <ListPagination
        page={listQuery.data?.page ?? page}
        pageSize={listQuery.data?.pageSize ?? 50}
        total={listQuery.data?.total ?? 0}
        onPageChange={(nextPage) => {
          void navigate({
            search: (prev) => ({ ...prev, page: nextPage }),
          })
        }}
      />

      <DailyCalculationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        record={editingRecord}
        onSuccess={() => {
          setEditingRecord(undefined)
        }}
      />

      <AlertDialog
        open={closeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !closeMutation.isPending) {
            setCloseTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this Daily Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              {closeTarget
                ? `${formatPeriodLabel(closeTarget.periodStart, closeTarget.periodEnd, closeTarget.recordStatus)} will be marked closed. You can still edit it later.`
                : 'This will mark the calculation as closed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={closeMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={closeMutation.isPending}
              onClick={() => void confirmClose()}
            >
              {closeMutation.isPending ? <Spinner /> : null}
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Daily Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${formatPeriodLabel(deleteTarget.periodStart, deleteTarget.periodEnd, deleteTarget.recordStatus)} will be removed permanently.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteMutation.isPending ? <Spinner /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
