import { formatCalendarDate } from '#/lib/calendar-date'

import type { CsvJinisCharaPreviewRow } from './admin.csv'
import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'
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

function formatPreviewDate(value: string | null) {
  if (!value) return '—'
  return formatCalendarDate(value)
}

export function AdminJinisCharaPreviewTable({
  records,
}: {
  records: CsvJinisCharaPreviewRow[]
}) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No rows found</EmptyTitle>
          <EmptyDescription>
            Upload a CSV with slNo, name, credit, and date.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/15">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Row</TableHead>
            <TableHead>Sl no</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Father&apos;s Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.rowNumber}>
              <TableCell>{record.rowNumber}</TableCell>
              <TableCell>{record.slNo ?? '—'}</TableCell>
              <TableCell>{record.name || '—'}</TableCell>
              <TableCell>{record.fatherName || '—'}</TableCell>
              <TableCell>{record.phoneNo || '—'}</TableCell>
              <TableCell>
                {record.credit
                  ? record.credit.toLocaleString('en-IN')
                  : '—'}
              </TableCell>
              <TableCell>{`${record.percentage ?? DEFAULT_JINISCHARA_PERCENTAGE}%`}</TableCell>
              <TableCell>{record.description || '—'}</TableCell>
              <TableCell>{formatPreviewDate(record.date)}</TableCell>
              <TableCell>
                {record.error ? (
                  <Badge variant="destructive">{record.error}</Badge>
                ) : (
                  <Badge>Ready</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
