import { format } from 'date-fns'
import { EyeIcon, LockIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import type { DailyCalculationRecord } from '#/features/dailycalculation/dailycalculation.types'
import {
  balanceStatusBadgeClass,
  formatMoney,
  formatPeriodLabel,
} from '#/features/dailycalculation/dailycalculation.utils'
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

type DailyCalculationTableProps = {
  records: DailyCalculationRecord[]
  onCreate: () => void
  onView: (record: DailyCalculationRecord) => void
  onEdit: (record: DailyCalculationRecord) => void
  onClose: (record: DailyCalculationRecord) => void
  onDelete: (record: DailyCalculationRecord) => void
  closingId?: string | null
}

export function DailyCalculationTable({
  records,
  onCreate,
  onView,
  onEdit,
  onClose,
  onDelete,
  closingId,
}: DailyCalculationTableProps) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No Daily Calculation yet</EmptyTitle>
          <EmptyDescription>
            Create a calculation for a business period to tally Tabil, Asol,
            Sudh, and Deoya.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={onCreate}>
            Create Daily Calculation
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
            <TableHead>Period</TableHead>
            <TableHead>Tabil</TableHead>
            <TableHead>Asol</TableHead>
            <TableHead>Sudh</TableHead>
            <TableHead>Deoya</TableHead>
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
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatPeriodLabel(
                      record.periodStart,
                      record.periodEnd,
                      record.recordStatus,
                    )}
                  </span>
                  {record.closedAt ? (
                    <span className="text-xs text-muted-foreground">
                      Closed {format(new Date(record.closedAt), 'dd MMM yyyy')}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{formatMoney(record.tabil)}</TableCell>
              <TableCell>{formatMoney(record.asol)}</TableCell>
              <TableCell>{formatMoney(record.sudh)}</TableCell>
              <TableCell>{formatMoney(record.deoya)}</TableCell>
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
                    record.recordStatus === 'OPEN' ? 'default' : 'secondary'
                  }
                >
                  {record.recordStatus === 'OPEN' ? 'Open' : 'Closed'}
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
                          aria-label="View all"
                          onClick={() => onView(record)}
                        />
                      }
                    >
                      <EyeIcon />
                    </TooltipTrigger>
                    <TooltipContent>View all</TooltipContent>
                  </Tooltip>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit Daily Calculation"
                    onClick={() => onEdit(record)}
                  >
                    <PencilIcon />
                  </Button>
                  {record.recordStatus === 'OPEN' ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Close period"
                            disabled={closingId === record.id}
                            onClick={() => onClose(record)}
                          />
                        }
                      >
                        <LockIcon />
                      </TooltipTrigger>
                      <TooltipContent>Close period</TooltipContent>
                    </Tooltip>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete Daily Calculation"
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
