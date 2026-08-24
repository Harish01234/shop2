import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircleIcon } from 'lucide-react'

import { MainCalculationModal } from '#/features/maincalculation/component/maincalculation-modal'
import { MainCalculationTable } from '#/features/maincalculation/component/maincalculation-table'
import { filtersFromSearch } from '#/features/maincalculation/maincalculation.filters'
import {
  useDeleteMainCalculation,
  useFinalizeMainCalculation,
  useMainCalculationList,
} from '#/features/maincalculation/maincalculation.hooks'
import { mainCalculationListQueryOptions } from '#/features/maincalculation/maincalculation.queries'
import type {
  MainCalculationRecord,
  MainCalculationView,
} from '#/features/maincalculation/maincalculation.types'
import { formatPeriod } from '#/features/maincalculation/maincalculation.utils'
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

export const Route = createFileRoute('/admin/main-calculation/')({
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const filters = filtersFromSearch(deps)
    return context.queryClient.ensureQueryData(
      mainCalculationListQueryOptions(deps.view, filters, deps.page),
    )
  },
  pendingComponent: MainCalculationListPending,
  errorComponent: MainCalculationListError,
  component: AdminMainCalculationPage,
})

function MainCalculationListPending() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}

function MainCalculationListError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Could not load Main Calculation</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  )
}

function AdminMainCalculationPage() {
  const search = Route.useSearch()
  const currentView: MainCalculationView = search.view
  const filters = filtersFromSearch(search)
  const page = search.page ?? 1
  const navigate = useNavigate({ from: '/admin/main-calculation/' })
  const listQuery = useMainCalculationList(currentView, filters, page)
  const deleteMutation = useDeleteMainCalculation()
  const finalizeMutation = useFinalizeMainCalculation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    MainCalculationRecord | undefined
  >()
  const [deleteTarget, setDeleteTarget] = useState<MainCalculationRecord | null>(
    null,
  )
  const [finalizeTarget, setFinalizeTarget] =
    useState<MainCalculationRecord | null>(null)

  const records = listQuery.data?.records ?? []

  function openCreateModal() {
    setEditingRecord(undefined)
    setModalOpen(true)
  }

  function openEditModal(record: MainCalculationRecord) {
    setEditingRecord(record)
    setModalOpen(true)
  }

  function openDetailPage(record: MainCalculationRecord) {
    void navigate({
      to: '/admin/main-calculation/$id/detail',
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

  async function confirmFinalize() {
    if (!finalizeTarget) return

    try {
      await finalizeMutation.mutateAsync({ id: finalizeTarget.id })
      setFinalizeTarget(null)
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">
            Main Calculation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tabil plus interest on the left; outstanding loans and cash on the
            right.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create Main Calculation
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          to="/admin/main-calculation"
          search={(prev) => ({ ...prev, view: 'draft', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'draft' ? 'default' : 'ghost',
            }),
          )}
        >
          Draft
        </Link>
        <Link
          to="/admin/main-calculation"
          search={(prev) => ({ ...prev, view: 'finalized', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'finalized' ? 'default' : 'ghost',
            }),
          )}
        >
          Finalized
        </Link>
        <Link
          to="/admin/main-calculation"
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

      {listQuery.isError && records.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load Main Calculation</AlertTitle>
          <AlertDescription>{listQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <MainCalculationTable
        records={records}
        onCreate={openCreateModal}
        onView={openDetailPage}
        onEdit={openEditModal}
        onFinalize={setFinalizeTarget}
        onDelete={setDeleteTarget}
        finalizingId={finalizeMutation.isPending ? finalizeTarget?.id : null}
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

      <MainCalculationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        record={editingRecord}
        onSuccess={() => {
          setEditingRecord(undefined)
        }}
      />

      <AlertDialog
        open={finalizeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !finalizeMutation.isPending) {
            setFinalizeTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize this Main Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              {finalizeTarget
                ? `Calculation for ${formatPeriod(finalizeTarget.dailyCalculation.periodStart, finalizeTarget.dailyCalculation.periodEnd)} will be recalculated and marked FINALIZED.`
                : 'This will mark the calculation as finalized.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={finalizeMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={finalizeMutation.isPending}
              onClick={() => void confirmFinalize()}
            >
              {finalizeMutation.isPending ? <Spinner /> : null}
              Finalize
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
            <AlertDialogTitle>Delete this Main Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
