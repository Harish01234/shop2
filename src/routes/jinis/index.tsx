import { useCallback, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'

import { AdvanceSearchFilter } from '#/features/jinis/component/AdvanceSearchFilter'
import {
  filtersFromSearch,
  parseJinisSearch,
  type JinisFilterValues,
} from '#/features/jinis/jinis.filters'
import {
  useDeleteJinis,
  useJinisList,
  useToggleJinis,
} from '#/features/jinis/jinis.hooks'
import { JinisModal } from '#/features/jinis/component/jinis-modal'
import { JinisTable } from '#/features/jinis/component/jinis-table'
import {
  jinisKeys,
  jinisListQueryOptions,
} from '#/features/jinis/jinis.queries'
import type { JinisRecord, JinisView } from '#/features/jinis/jinis.types'
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

export const Route = createFileRoute('/jinis/')({
  validateSearch: (search: Record<string, unknown>) => parseJinisSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const filters = filtersFromSearch(deps)
    return context.queryClient.ensureQueryData(
      jinisListQueryOptions(deps.view, filters, deps.page),
    )
  },
  pendingComponent: JinisListPending,
  errorComponent: JinisListError,
  component: JinisListPage,
})

function JinisListPending() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-28" />
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

function JinisListError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const queryClient = useQueryClient()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Could not load Jinis</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <div>
        <Button
          type="button"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: jinisKeys.all })
            reset()
          }}
        >
          Try again
        </Button>
      </div>
    </main>
  )
}

function JinisListPage() {
  const search = Route.useSearch()
  const currentView: JinisView = search.view
  const filters = filtersFromSearch(search)
  const page = search.page ?? 1
  const navigate = useNavigate({ from: '/jinis/' })
  const jinisQuery = useJinisList(currentView, filters, page)
  const deleteJinisMutation = useDeleteJinis()
  const toggleJinisMutation = useToggleJinis()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<JinisRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<JinisRecord | null>(null)

  const records = jinisQuery.data?.records ?? []
  const totalCount = jinisQuery.data?.allCount ?? 0
  const activeCount = jinisQuery.data?.activeCount ?? 0
  const togglingId = toggleJinisMutation.isPending
    ? (toggleJinisMutation.variables?.record.id ?? null)
    : null

  const handleFiltersChange = useCallback(
    (nextFilters: JinisFilterValues) => {
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

  function openEditModal(record: JinisRecord) {
    setEditingRecord(record)
    setModalOpen(true)
  }

  function handleToggleActive(record: JinisRecord, active: boolean) {
    toggleJinisMutation.mutate({ record, active })
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    try {
      await deleteJinisMutation.mutateAsync(deleteTarget)
      setDeleteTarget(null)
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">
            Jinis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loans against gold or silver.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create Jinis
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          to="/jinis"
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
          to="/jinis"
          search={(prev) => ({ ...prev, view: 'settled', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentView === 'settled' ? 'default' : 'ghost',
            }),
          )}
        >
          Settled
        </Link>
        <Link
          to="/jinis"
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
        totalCount={totalCount}
        activeCount={activeCount}
      />

      {jinisQuery.isError && records.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load Jinis</AlertTitle>
          <AlertDescription>
            {jinisQuery.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <JinisTable
        records={records}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onToggleActive={handleToggleActive}
        togglingId={togglingId}
      />

      <ListPagination
        page={jinisQuery.data?.page ?? page}
        pageSize={jinisQuery.data?.pageSize ?? 50}
        total={jinisQuery.data?.total ?? 0}
        onPageChange={(nextPage) => {
          void navigate({
            search: (prev) => ({ ...prev, page: nextPage }),
          })
        }}
      />

      <JinisModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jinis={editingRecord}
        onSuccess={() => {
          setEditingRecord(undefined)
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteJinisMutation.isPending) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Jinis?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `#${deleteTarget.slNo} · ${deleteTarget.name} will be removed permanently.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={deleteJinisMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteJinisMutation.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteJinisMutation.isPending ? <Spinner /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
