import { useCallback, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'

import { AdvanceSearchFilter } from '#/features/interest/component/AdvanceSearchFilter'
import { InterestModal } from '#/features/interest/component/interest-modal'
import { InterestTable } from '#/features/interest/component/interest-table'
import {
  filtersFromSearch,
  parseInterestSearch,
  type InterestFilterValues,
} from '#/features/interest/interest.filters'
import {
  useDeleteInterest,
  useInterestList,
} from '#/features/interest/interest.hooks'
import {
  interestKeys,
  interestListQueryOptions,
} from '#/features/interest/interest.queries'
import type {
  InterestRecord,
  InterestSource,
} from '#/features/interest/interest.types'
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

export const Route = createFileRoute('/admin/interest')({
  validateSearch: (search: Record<string, unknown>) =>
    parseInterestSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const filters = filtersFromSearch(deps)
    return context.queryClient.ensureQueryData(
      interestListQueryOptions(deps.source, filters, deps.page),
    )
  },
  pendingComponent: InterestListPending,
  errorComponent: InterestListError,
  component: AdminInterestPage,
})

function InterestListPending() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}

function InterestListError({
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
        <AlertTitle>Could not load Interest</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <div>
        <Button
          type="button"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: interestKeys.all })
            reset()
          }}
        >
          Try again
        </Button>
      </div>
    </main>
  )
}

function AdminInterestPage() {
  const search = Route.useSearch()
  const currentSource: InterestSource = search.source
  const filters = filtersFromSearch(search)
  const page = search.page ?? 1
  const navigate = useNavigate({ from: '/admin/interest' })
  const interestQuery = useInterestList(currentSource, filters, page)
  const deleteMutation = useDeleteInterest()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InterestRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<InterestRecord | null>(null)

  const records = interestQuery.data?.records ?? []

  const handleFiltersChange = useCallback(
    (nextFilters: InterestFilterValues) => {
      void navigate({
        replace: true,
        search: {
          source: currentSource,
          ...nextFilters,
          page: 1,
        },
      })
    },
    [currentSource, navigate],
  )

  function openCreateModal() {
    setEditingRecord(undefined)
    setModalOpen(true)
  }

  function openEditModal(record: InterestRecord) {
    setEditingRecord(record)
    setModalOpen(true)
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
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground">
            Interest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payments against Jinis, JinisChara, or a person.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create Interest
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          to="/admin/interest"
          search={(prev) => ({ ...prev, source: 'all', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentSource === 'all' ? 'default' : 'ghost',
            }),
          )}
        >
          All
        </Link>
        <Link
          to="/admin/interest"
          search={(prev) => ({ ...prev, source: 'jinis', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentSource === 'jinis' ? 'default' : 'ghost',
            }),
          )}
        >
          Jinis
        </Link>
        <Link
          to="/admin/interest"
          search={(prev) => ({ ...prev, source: 'jinischara', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentSource === 'jinischara' ? 'default' : 'ghost',
            }),
          )}
        >
          JinisChara
        </Link>
        <Link
          to="/admin/interest"
          search={(prev) => ({ ...prev, source: 'person', page: 1 })}
          className={cn(
            buttonVariants({
              variant: currentSource === 'person' ? 'default' : 'ghost',
            }),
          )}
        >
          Person
        </Link>
      </div>

      <AdvanceSearchFilter
        filters={filters}
        onChange={handleFiltersChange}
        totalCount={interestQuery.data?.total ?? 0}
      />

      {interestQuery.isError && records.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load Interest</AlertTitle>
          <AlertDescription>{interestQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <InterestTable
        records={records}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <ListPagination
        page={interestQuery.data?.page ?? page}
        pageSize={interestQuery.data?.pageSize ?? 50}
        total={interestQuery.data?.total ?? 0}
        onPageChange={(nextPage) => {
          void navigate({
            search: (prev) => ({ ...prev, page: nextPage }),
          })
        }}
      />

      <InterestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        interest={editingRecord}
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
            <AlertDialogTitle>Delete this Interest?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.amount.toLocaleString('en-IN')} will be removed permanently.`
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
