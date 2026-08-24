import { format } from 'date-fns'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'

import { MainCalculationModal } from '#/features/maincalculation/component/maincalculation-modal'
import { useMainCalculationDetail } from '#/features/maincalculation/maincalculation.hooks'
import { refetchMainCalculationDetail, refetchMainCalculationLists } from '#/features/maincalculation/maincalculation.queries'
import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'
import {
  balanceStatusBadgeClass,
  formatMoney,
  formatPeriod,
} from '#/features/maincalculation/maincalculation.utils'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

const detailRouteApi = getRouteApi('/admin/main-calculation/$id/detail')

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

type MainCalculationDetailViewProps = {
  mainCalculationId: string
}

export function MainCalculationDetailView({
  mainCalculationId,
}: MainCalculationDetailViewProps) {
  const listSearch = detailRouteApi.useSearch()
  const queryClient = useQueryClient()
  const detailQuery = useMainCalculationDetail(mainCalculationId)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<
    MainCalculationRecord | undefined
  >()

  const record = detailQuery.data

  function openEditModal() {
    if (!record) return
    setEditingRecord(record)
    setEditModalOpen(true)
  }

  async function handleEditSuccess() {
    await Promise.all([
      refetchMainCalculationDetail(queryClient, mainCalculationId),
      refetchMainCalculationLists(queryClient),
    ])
  }

  if (detailQuery.isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </main>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Link
          to="/admin/main-calculation"
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
          {detailQuery.error?.message ?? 'Main Calculation not found.'}
        </p>
      </main>
    )
  }

  const calculationDateLabel = format(
    new Date(record.calculationDate),
    'dd MMM yyyy',
  )
  const periodLabel = formatPeriod(
    record.dailyCalculation.periodStart,
    record.dailyCalculation.periodEnd,
  )

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/main-calculation"
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
              onClick={() => openEditModal()}
            >
              <PencilIcon className="size-4" />
              Edit
            </Button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-medium text-foreground">
                {calculationDateLabel}
              </h1>
              <Badge
                variant={
                  record.recordStatus === 'DRAFT' ? 'default' : 'secondary'
                }
              >
                {record.recordStatus}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily Calculation: {periodLabel}
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
              <SummaryLine label="Total Tabil" value={record.totalTabil} />
              <SummaryLine label="Interest" value={record.interest} />
              <SummaryLine
                label="Left total"
                value={record.leftTotal}
                variant="result"
              />
            </div>
          </div>
          <div className="border-t border-border p-5 md:border-t-0 md:pl-6">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Right
            </h3>
            <div className="flex flex-col gap-0.5">
              <SummaryLine label="Bandak" value={record.bandak} />
              <SummaryLine label="Jinis Chara" value={record.jinisChara} />
              <SummaryLine label="Cash" value={record.cash} />
              <SummaryLine
                label="Right total"
                value={record.rightTotal}
                variant="result"
              />
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-5',
            record.balanceStatus === 'CORRECT'
              ? 'bg-emerald-500/5'
              : 'bg-destructive/5',
          )}
        >
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Difference
            </span>
            <span className="font-heading text-2xl font-semibold tabular-nums tracking-tight">
              {formatMoney(record.difference)}
            </span>
            <span className="text-xs text-muted-foreground">
              Left total − Right total
            </span>
          </div>
          <Badge
            variant={
              record.balanceStatus === 'INCORRECT' ? 'destructive' : 'outline'
            }
            className={cn(
              'px-3 py-1 text-sm',
              balanceStatusBadgeClass(record.balanceStatus),
            )}
          >
            {record.balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}
          </Badge>
        </div>
      </div>

      <MainCalculationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        record={editingRecord}
        onSuccess={() => void handleEditSuccess()}
      />
    </main>
  )
}
