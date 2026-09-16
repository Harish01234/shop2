import { formatCalendarDate } from '#/lib/calendar-date'

import type { InterestImportPreviewRow } from '#/features/interest/interest.types'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
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

function formatAmount(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('en-IN')
}

function statusBadge(row: InterestImportPreviewRow) {
  if (row.status === 'error') {
    return <Badge variant="destructive">{row.message ?? 'Error'}</Badge>
  }
  if (row.status === 'warning') {
    return (
      <Badge className="border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
        {row.message ?? 'Warning'}
      </Badge>
    )
  }
  return <Badge>OK</Badge>
}

export function InterestImportPreviewTable({
  records,
}: {
  records: InterestImportPreviewRow[]
}) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No rows found</EmptyTitle>
          <EmptyDescription>
            No data rows were found under the SL NO / AMOUNT / SUDH / DATE
            header.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/15">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Row</TableHead>
            <TableHead>SL No / Person</TableHead>
            <TableHead>Sheet amount</TableHead>
            <TableHead>Jinis credit</TableHead>
            <TableHead>Sudh</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.rowNumber}>
              <TableCell>{record.rowNumber}</TableCell>
              <TableCell>
                {record.slNo != null
                  ? record.slNo
                  : record.personName || '—'}
              </TableCell>
              <TableCell>{formatAmount(record.sheetAmount)}</TableCell>
              <TableCell>{formatAmount(record.jinisCredit)}</TableCell>
              <TableCell>{formatAmount(record.sudh)}</TableCell>
              <TableCell>
                {record.date ? formatCalendarDate(record.date) : '—'}
              </TableCell>
              <TableCell>{statusBadge(record)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
