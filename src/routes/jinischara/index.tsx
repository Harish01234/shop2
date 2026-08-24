import { useCallback, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'

import { AdvanceSearchFilter } from '#/features/jinischara/component/AdvanceSearchFilter'
import { JinisCharaModal } from '#/features/jinischara/component/jinischara-modal'
import { JinisCharaTable } from '#/features/jinischara/component/jinischara-table'
import {
  filtersFromSearch,
  parseJinisCharaSearch,
  type JinisCharaFilterValues,
} from '#/features/jinischara/jinischara.filters'
import {
  useDeleteJinisChara,
  useJinisCharaList,
  useToggleJinisChara,
} from '#/features/jinischara/jinischara.hooks'
import {
  jinisCharaKeys,
  jinisCharaListQueryOptions,
} from '#/features/jinischara/jinischara.queries'
import type {
  JinisCharaRecord,
  JinisCharaView,
} from '#/features/jinischara/jinischara.types'
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

export const Route = createFileRoute('/jinischara/')({
  validateSearch: (search: Record<string, unknown>) =>
    parseJinisCharaSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const filters = filtersFromSearch(deps)
    return context.queryClient.ensureQueryData(
      jinisCharaListQueryOptions(deps.view, filters, deps.page),
    )
  },
  pendingComponent: JinisCharaListPending,
  errorComponent: JinisCharaListError,
  component: JinisCharaListPage,
})

function JinisCharaListPending() {
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

function JinisCharaListError({
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
        <AlertTitle>Could not load JinisChara</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <div>
        <Button
          type="button"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: jinisCharaKeys.all })
            reset()
          }}
        >
          Try again
        </Button>
      </div>
    </main>
  )
}

function JinisCharaListPage() {
  const search = Route.useSearch()
  const currentView: JinisCharaView = search.view
  const filters = filtersFromSearch(search)
  const page = search.page ?? 1
  const navigate = useNavigate({ from: '/jinischara/' })
  const listQuery = useJinisCharaList(currentView, filters, page)
  const deleteMutation = useDeleteJinisChara()
  const toggleMutation = useToggleJinisChara()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    JinisCharaRecord | undefined
  >()
  const [deleteTarget, setDeleteTarget] = useState<JinisCharaRecord | null>(
    null,
  )

  const records = listQuery.data?.records ?? []
  const totalCount = listQuery.data?.allCount ?? 0
  const activeCount = listQuery.data?.activeCount ?? 0
  const togglingId = toggleMutation.isPending
    ? (toggleMutation.variables?.record.id ?? null)
    : null

  const handleFiltersChange = useCallback(
    (nextFilters: JinisCharaFilterValues) => {
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

  function openEditModal(record: JinisCharaRecord) {
    setEditingRecord(record)
    setModalOpen(true)
  }

  function handleToggleActive(record: JinisCharaRecord, active: boolean) {
    toggleMutation.mutate({ record, active })
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">
            JinisChara
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loans with a percentage rate.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create JinisChara
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          to="/jinischara"
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
          to="/jinischara"
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
          to="/jinischara"
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

      {listQuery.isError && records.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load JinisChara</AlertTitle>
          <AlertDescription>{listQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <JinisCharaTable
        records={records}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onToggleActive={handleToggleActive}
        togglingId={togglingId}
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

      <JinisCharaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jinisChara={editingRecord}
        onSuccess={() => {
          setEditingRecord(undefined)
        }}
      />

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
            <AlertDialogTitle>Delete this JinisChara?</AlertDialogTitle>
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
