import { format } from 'date-fns'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { DailyCalculationModal } from '#/features/dailycalculation/component/dailycalculation-modal'
import {
  useDailyCalculationDetail,
  useSyncDailyCalculationDetail,
} from '#/features/dailycalculation/dailycalculation.hooks'
import type {
  DailyCalculationAsolSudhRow,
  DailyCalculationDeoyaRow,
  DailyCalculationLoanSource,
  DailyCalculationRecord,
} from '#/features/dailycalculation/dailycalculation.types'
import {
  balanceStatusBadgeClass,
  formatMoney,
  formatPeriodLabel,
} from '#/features/dailycalculation/dailycalculation.utils'
import { InterestModal } from '#/features/interest/component/interest-modal'
import { getInterest } from '#/features/interest/interest.functions'
import { useDeleteInterest } from '#/features/interest/interest.hooks'
import type { InterestRecord } from '#/features/interest/interest.types'
import { JinisModal } from '#/features/jinis/component/jinis-modal'
import { getJinis, updateJinis } from '#/features/jinis/jinis.functions'
import { useDeleteJinis } from '#/features/jinis/jinis.hooks'
import type { JinisRecord } from '#/features/jinis/jinis.types'
import { JinisCharaModal } from '#/features/jinischara/component/jinischara-modal'
import { getJinisChara, updateJinisChara } from '#/features/jinischara/jinischara.functions'
import { useDeleteJinisChara } from '#/features/jinischara/jinischara.hooks'
import type { JinisCharaRecord } from '#/features/jinischara/jinischara.types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const detailRouteApi = getRouteApi('/admin/daily-calculation/$id/detail')

type DailyCalculationDetailViewProps = {
  dailyCalculationId: string
}

function formatDetailDate(value: Date | string) {
  return format(new Date(value), 'dd MMM yyyy')
}

function defaultInterestDateInPeriod(
  periodStart: Date | string,
  periodEnd: Date | string,
) {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const today = new Date()
  const todayTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime()
  const startTime = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime()
  const endTime = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime()

  if (todayTime >= startTime && todayTime <= endTime) {
    return today
  }

  return end
}

function DetailColumnEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}

function rowKey(prefix: string, row: { recordId: string; interestId?: string | null; date: Date | string }) {
  return `${prefix}-${row.recordId}-${row.interestId ?? 'none'}-${formatDetailDate(row.date)}`
}

function canDeleteAsolSudhRow(row: DailyCalculationAsolSudhRow) {
  if (row.source === 'Person') return Boolean(row.interestId)
  return Boolean(row.interestId) || row.amount > 0
}

function asolSudhDeleteTitle(row: DailyCalculationAsolSudhRow) {
  if (row.source !== 'Person' && row.amount > 0) {
    return row.interestId
      ? `Remove interest and reopen ${row.source} #${row.slNo}?`
      : `Reopen settled ${row.source} #${row.slNo}?`
  }
  return 'Delete this Interest?'
}

function asolSudhDeleteDescription(row: DailyCalculationAsolSudhRow) {
  if (row.source === 'Person') {
    return `${formatMoney(row.sudh)} interest will be removed permanently.`
  }
  if (row.amount > 0 && row.interestId) {
    return `${formatMoney(row.sudh)} interest will be removed and ${formatMoney(row.amount)} settled credit will be cleared. ${row.source} #${row.slNo} will be marked active again.`
  }
  if (row.amount > 0) {
    return `${formatMoney(row.amount)} settled credit will be cleared and ${row.source} #${row.slNo} will be marked active again.`
  }
  return `${formatMoney(row.sudh)} interest will be removed permanently. The loan record will stay open.`
}

function SummaryLine({
  label,
  value,
  variant = 'line',
}: {
  label: string
  value: number
  variant?: 'line' | 'subtotal' | 'result'
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-md px-3',
        variant === 'line' && 'py-1.5',
        variant === 'subtotal' &&
          'mt-1 bg-muted/50 py-2 ring-1 ring-foreground/5',
        variant === 'result' &&
          'mt-1.5 bg-muted/70 py-2.5 ring-1 ring-foreground/10',
      )}
    >
      <span
        className={cn(
          variant === 'line' && 'text-sm text-muted-foreground',
          variant === 'subtotal' && 'text-sm font-medium text-foreground',
          variant === 'result' && 'text-sm font-semibold text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          variant === 'subtotal' && 'text-sm font-semibold',
          variant === 'result' && 'text-base font-semibold',
        )}
      >
        {formatMoney(value)}
      </span>
    </div>
  )
}

export function DailyCalculationDetailView({
  dailyCalculationId,
}: DailyCalculationDetailViewProps) {
  const listSearch = detailRouteApi.useSearch()
  const detailQuery = useDailyCalculationDetail(dailyCalculationId)
  const syncAfterMutation = useSyncDailyCalculationDetail(dailyCalculationId)
  const deleteJinisMutation = useDeleteJinis()
  const deleteJinisCharaMutation = useDeleteJinisChara()
  const deleteInterestMutation = useDeleteInterest()

  const getJinisFn = useServerFn(getJinis)
  const getJinisCharaFn = useServerFn(getJinisChara)
  const getInterestFn = useServerFn(getInterest)
  const updateJinisFn = useServerFn(updateJinis)
  const updateJinisCharaFn = useServerFn(updateJinisChara)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    DailyCalculationRecord | undefined
  >()
  const [jinisModalOpen, setJinisModalOpen] = useState(false)
  const [jinisCharaModalOpen, setJinisCharaModalOpen] = useState(false)
  const [interestModalOpen, setInterestModalOpen] = useState(false)
  const [editingJinis, setEditingJinis] = useState<JinisRecord | undefined>()
  const [editingJinisChara, setEditingJinisChara] = useState<
    JinisCharaRecord | undefined
  >()
  const [editingInterest, setEditingInterest] = useState<
    InterestRecord | undefined
  >()
  const [interestAsolContext, setInterestAsolContext] = useState<
    | {
        settledCredit: number
        source: DailyCalculationLoanSource
      }
    | undefined
  >()
  const [deleteDeoyaTarget, setDeleteDeoyaTarget] =
    useState<DailyCalculationDeoyaRow | null>(null)
  const [deleteAsolSudhTarget, setDeleteAsolSudhTarget] =
    useState<DailyCalculationAsolSudhRow | null>(null)
  const [deletingAsolSudhKey, setDeletingAsolSudhKey] = useState<string | null>(
    null,
  )
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  const detail = detailQuery.data

  async function handleMutationSuccess() {
    await syncAfterMutation()
  }

  async function openEditDailyCalculation() {
    if (!detail) return
    setEditingRecord(detail)
    setEditModalOpen(true)
  }

  function openCreateJinis() {
    setEditingJinis(undefined)
    setJinisModalOpen(true)
  }

  function openCreateJinisChara() {
    setEditingJinisChara(undefined)
    setJinisCharaModalOpen(true)
  }

  function openCreateInterest() {
    setEditingInterest(undefined)
    setInterestAsolContext(undefined)
    setInterestModalOpen(true)
  }

  async function openDeoyaEdit(row: DailyCalculationDeoyaRow) {
    setLoadingEditId(row.recordId)
    try {
      if (row.source === 'Jinis') {
        const record = (await getJinisFn({
          data: { id: row.recordId },
        })) as JinisRecord
        setEditingJinis(record)
        setJinisModalOpen(true)
      } else {
        const record = (await getJinisCharaFn({
          data: { id: row.recordId },
        })) as JinisCharaRecord
        setEditingJinisChara(record)
        setJinisCharaModalOpen(true)
      }
    } finally {
      setLoadingEditId(null)
    }
  }

  async function openAsolSudhEdit(row: DailyCalculationAsolSudhRow) {
    if (!row.interestId) return

    setLoadingEditId(row.interestId)
    try {
      const record = (await getInterestFn({
        data: { id: row.interestId },
      })) as InterestRecord
      setEditingInterest(record)
      if (
        (row.source === 'Jinis' || row.source === 'JinisChara') &&
        row.amount > 0
      ) {
        setInterestAsolContext({
          settledCredit: row.amount,
          source: row.source,
        })
      } else {
        setInterestAsolContext(undefined)
      }
      setInterestModalOpen(true)
    } finally {
      setLoadingEditId(null)
    }
  }

  async function confirmDeleteDeoya() {
    if (!deleteDeoyaTarget) return

    try {
      if (deleteDeoyaTarget.source === 'Jinis') {
        await deleteJinisMutation.mutateAsync({
          id: deleteDeoyaTarget.recordId,
        } as JinisRecord)
      } else {
        await deleteJinisCharaMutation.mutateAsync({
          id: deleteDeoyaTarget.recordId,
        } as JinisCharaRecord)
      }
      setDeleteDeoyaTarget(null)
      await handleMutationSuccess()
    } catch {
      // Toast handled by mutation hooks.
    }
  }

  async function confirmDeleteAsolSudh() {
    if (!deleteAsolSudhTarget) return

    const row = deleteAsolSudhTarget
    const rowDeleteKey = rowKey('asol', row)
    setDeletingAsolSudhKey(rowDeleteKey)

    try {
      if (row.interestId) {
        await deleteInterestMutation.mutateAsync({
          id: row.interestId,
          amount: row.sudh,
        } as InterestRecord)
      }

      if (row.source === 'Jinis' && row.amount > 0) {
        await updateJinisFn({
          data: { id: row.recordId, active: true, settledAt: null },
        })
      } else if (row.source === 'JinisChara' && row.amount > 0) {
        await updateJinisCharaFn({
          data: { id: row.recordId, active: true, settledAt: null },
        })
      }

      setDeleteAsolSudhTarget(null)
      await handleMutationSuccess()
    } catch {
      // Toast handled by mutation hooks.
    } finally {
      setDeletingAsolSudhKey(null)
    }
  }

  if (detailQuery.isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </main>
    )
  }

  if (detailQuery.isError || !detail) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Link
          to="/admin/daily-calculation"
          search={listSearch}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'w-fit gap-2 px-2',
          )}
        >
          <ArrowLeftIcon className="size-4" />
          Back to list
        </Link>
        <p className="text-sm text-destructive">
          {detailQuery.error?.message ?? 'Daily Calculation not found.'}
        </p>
      </main>
    )
  }

  const periodLabel = formatPeriodLabel(
    detail.periodStart,
    detail.periodEnd,
    detail.recordStatus,
  )
  const leftSubtotal = detail.tabil + detail.asol + detail.sudh

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/daily-calculation"
              search={listSearch}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'gap-2 px-2',
              )}
            >
              <ArrowLeftIcon className="size-4" />
              Back to list
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background"
              onClick={() => openEditDailyCalculation()}
            >
              <PencilIcon className="size-4" />
              Edit
            </Button>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-medium text-foreground">
              {periodLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Transaction breakdown and period totals.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/15">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-border">
          <div className="p-5 md:pr-6">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Left
            </h3>
            <div className="flex flex-col gap-0.5">
              <SummaryLine label="Tabil" value={detail.tabil} />
              <SummaryLine label="Asol" value={detail.asol} />
              <SummaryLine label="Sudh" value={detail.sudh} />
              <SummaryLine label="Total" value={leftSubtotal} variant="subtotal" />
              <SummaryLine label="Deoya" value={detail.deoya} />
              <SummaryLine label="Val1" value={detail.leftTotal} variant="result" />
            </div>
          </div>
          <div className="border-t border-border p-5 md:border-t-0 md:pl-6">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Right
            </h3>
            <div className="flex flex-col gap-0.5">
              <SummaryLine label="Cash in Home" value={detail.cashInHome} />
              <SummaryLine label="Cash in Shop" value={detail.cashInShop} />
              {(detail.personMoneyEntries ?? []).map((entry) => (
                <SummaryLine
                  key={entry.id}
                  label={entry.personName}
                  value={entry.amount}
                />
              ))}
              <SummaryLine label="Val2" value={detail.rightTotal} variant="result" />
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-5',
            detail.balanceStatus === 'CORRECT'
              ? 'bg-emerald-500/5'
              : 'bg-destructive/5',
          )}
        >
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Difference
            </span>
            <span className="font-heading text-2xl font-semibold tabular-nums tracking-tight">
              {formatMoney(detail.difference)}
            </span>
            <span className="text-xs text-muted-foreground">Val1 − Val2</span>
          </div>
          <Badge
            variant={
              detail.balanceStatus === 'INCORRECT' ? 'destructive' : 'outline'
            }
            className={cn(
              'px-3 py-1 text-sm',
              balanceStatusBadgeClass(detail.balanceStatus),
            )}
          >
            {detail.balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium text-foreground">Deoya</h2>
              <p className="text-sm text-muted-foreground">
                New credit issued during the period.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" size="sm" className="gap-1">
                    <PlusIcon className="size-4" />
                    Add
                    <ChevronDownIcon className="size-4 opacity-70" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openCreateJinis}>
                  Add Jinis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openCreateJinisChara}>
                  Add JinisChara
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {detail.deoyaRows.length === 0 ? (
            <DetailColumnEmpty message="No records in this period" />
          ) : (
            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/15">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="sticky right-0 z-10 border-l border-border bg-card text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.deoyaRows.map((row) => (
                    <TableRow key={rowKey('deoya', row)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{row.slNo}</span>
                          <span className="text-xs text-muted-foreground">
                            {row.source}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.amount)}
                      </TableCell>
                      <TableCell>{formatDetailDate(row.date)}</TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${row.source}`}
                            disabled={loadingEditId === row.recordId}
                            onClick={() => void openDeoyaEdit(row)}
                          >
                            {loadingEditId === row.recordId ? (
                              <Spinner />
                            ) : (
                              <PencilIcon />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${row.source}`}
                            onClick={() => setDeleteDeoyaTarget(row)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total Deoya</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(detail.deoya)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium text-foreground">Asol + Sudh</h2>
              <p className="text-sm text-muted-foreground">
                Settled credit and interest during the period.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openCreateInterest}>
              <PlusIcon className="size-4" />
              Add Interest
            </Button>
          </div>

          {detail.asolSudhRows.length === 0 ? (
            <DetailColumnEmpty message="No records in this period" />
          ) : (
            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/15">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL No</TableHead>
                    <TableHead className="text-right">
                      Amount (settled)
                    </TableHead>
                    <TableHead className="text-right">Sudh</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="sticky right-0 z-10 border-l border-border bg-card text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.asolSudhRows.map((row) => (
                    <TableRow key={rowKey('asol', row)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {row.source === 'Person'
                              ? (row.personName || '—')
                              : row.slNo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {row.source}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.sudh)}
                      </TableCell>
                      <TableCell>{formatDetailDate(row.date)}</TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit interest"
                            disabled={
                              !row.interestId ||
                              loadingEditId === row.interestId
                            }
                            onClick={() => void openAsolSudhEdit(row)}
                          >
                            {loadingEditId === row.interestId ? (
                              <Spinner />
                            ) : (
                              <PencilIcon />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete Asol + Sudh row"
                            disabled={
                              !canDeleteAsolSudhRow(row) ||
                              deletingAsolSudhKey === rowKey('asol', row)
                            }
                            onClick={() => setDeleteAsolSudhTarget(row)}
                          >
                            {deletingAsolSudhKey === rowKey('asol', row) ? (
                              <Spinner />
                            ) : (
                              <Trash2Icon />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total Asol</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(detail.asol)}
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Sudh (all interest)</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-medium">
                      {formatMoney(detail.sudh)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </section>
      </div>

      <DailyCalculationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        record={editingRecord}
        onSuccess={() => {
          setEditingRecord(undefined)
          void handleMutationSuccess()
        }}
      />

      <JinisModal
        open={jinisModalOpen}
        onOpenChange={setJinisModalOpen}
        jinis={editingJinis}
        onSuccess={() => {
          setEditingJinis(undefined)
          void handleMutationSuccess()
        }}
      />

      <JinisCharaModal
        open={jinisCharaModalOpen}
        onOpenChange={setJinisCharaModalOpen}
        jinisChara={editingJinisChara}
        onSuccess={() => {
          setEditingJinisChara(undefined)
          void handleMutationSuccess()
        }}
      />

      <InterestModal
        open={interestModalOpen}
        onOpenChange={(open) => {
          setInterestModalOpen(open)
          if (!open) {
            setInterestAsolContext(undefined)
          }
        }}
        interest={editingInterest}
        asolContext={interestAsolContext}
        defaultDate={
          editingInterest
            ? undefined
            : defaultInterestDateInPeriod(detail.periodStart, detail.periodEnd)
        }
        onSuccess={() => {
          setEditingInterest(undefined)
          setInterestAsolContext(undefined)
          void handleMutationSuccess()
        }}
      />

      <AlertDialog
        open={deleteDeoyaTarget !== null}
        onOpenChange={(open) => {
          if (
            !open &&
            !deleteJinisMutation.isPending &&
            !deleteJinisCharaMutation.isPending
          ) {
            setDeleteDeoyaTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {deleteDeoyaTarget?.source}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDeoyaTarget
                ? `#${deleteDeoyaTarget.slNo} will be removed permanently.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={
                deleteJinisMutation.isPending ||
                deleteJinisCharaMutation.isPending
              }
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteJinisMutation.isPending ||
                deleteJinisCharaMutation.isPending
              }
              onClick={() => void confirmDeleteDeoya()}
            >
              {deleteJinisMutation.isPending ||
              deleteJinisCharaMutation.isPending ? (
                <Spinner />
              ) : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteAsolSudhTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingAsolSudhKey) {
            setDeleteAsolSudhTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteAsolSudhTarget
                ? asolSudhDeleteTitle(deleteAsolSudhTarget)
                : 'Delete this row?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAsolSudhTarget
                ? asolSudhDeleteDescription(deleteAsolSudhTarget)
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={Boolean(deletingAsolSudhKey)}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(deletingAsolSudhKey)}
              onClick={() => void confirmDeleteAsolSudh()}
            >
              {deletingAsolSudhKey ? <Spinner /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
