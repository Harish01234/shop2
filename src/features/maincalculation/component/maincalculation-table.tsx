import { CheckIcon, EyeIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { formatCalendarDate } from '#/lib/calendar-date'

import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'
import {
  balanceStatusBadgeClass,
  formatMoney,
  formatPeriod,
} from '#/features/maincalculation/maincalculation.utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type MainCalculationTableProps = {
  records: MainCalculationRecord[]
  onCreate: () => void
  onView: (record: MainCalculationRecord) => void
  onEdit: (record: MainCalculationRecord) => void
  onFinalize: (record: MainCalculationRecord) => void
  onDelete: (record: MainCalculationRecord) => void
  finalizingId?: string | null
}

export function MainCalculationTable({
  records,
  onCreate,
  onView,
  onEdit,
  onFinalize,
  onDelete,
  finalizingId,
}: MainCalculationTableProps) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No Main Calculation yet</EmptyTitle>
          <EmptyDescription>
            Create a main calculation linked to an open Daily Calculation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={onCreate}>
            Create Main Calculation
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/15">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Calculation Date</TableHead>
            <TableHead>Daily Calculation</TableHead>
            <TableHead>Total Tabil</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Bandak</TableHead>
            <TableHead>Jinis Chara</TableHead>
            <TableHead>Cash</TableHead>
            <TableHead>Left</TableHead>
            <TableHead>Right</TableHead>
            <TableHead>Diff</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="sticky right-0 z-10 border-l border-border bg-card text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {formatCalendarDate(record.calculationDate)}
              </TableCell>
              <TableCell>
                {formatPeriod(
                  record.dailyCalculation.periodStart,
                  record.dailyCalculation.periodEnd,
                )}
              </TableCell>
              <TableCell>{formatMoney(record.totalTabil)}</TableCell>
              <TableCell>{formatMoney(record.interest)}</TableCell>
              <TableCell>{formatMoney(record.bandak)}</TableCell>
              <TableCell>{formatMoney(record.jinisChara)}</TableCell>
              <TableCell>{formatMoney(record.cash)}</TableCell>
              <TableCell>{formatMoney(record.leftTotal)}</TableCell>
              <TableCell>{formatMoney(record.rightTotal)}</TableCell>
              <TableCell>{formatMoney(record.difference)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.balanceStatus === 'INCORRECT'
                      ? 'destructive'
                      : 'outline'
                  }
                  className={cn(balanceStatusBadgeClass(record.balanceStatus))}
                >
                  {record.balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.recordStatus === 'DRAFT' ? 'default' : 'secondary'
                  }
                >
                  {record.recordStatus}
                </Badge>
              </TableCell>
              <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View Main Calculation"
                          onClick={() => onView(record)}
                        />
                      }
                    >
                      <EyeIcon />
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit Main Calculation"
                    onClick={() => onEdit(record)}
                  >
                    <PencilIcon />
                  </Button>
                  {record.recordStatus === 'DRAFT' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Finalize Main Calculation"
                      disabled={finalizingId === record.id}
                      onClick={() => onFinalize(record)}
                    >
                      <CheckIcon />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete Main Calculation"
                    onClick={() => onDelete(record)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
