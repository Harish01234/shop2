import { format } from 'date-fns'

import type { CsvJinisPreviewRow } from './admin.csv'
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

export function AdminJinisPreviewTable({
  records,
}: {
  records: CsvJinisPreviewRow[]
}) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No rows found</EmptyTitle>
          <EmptyDescription>
            Upload a CSV with Sl no and credit.
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
            <TableHead>Sl no</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Father's Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Credit</TableHead>
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
              <TableCell>
                {record.date && record.date !== '1970-01-01'
                  ? format(new Date(`${record.date}T00:00:00`), 'dd MMM yyyy')
                  : '—'}
              </TableCell>
              <TableCell>
                {record.credit
                  ? record.credit.toLocaleString('en-IN')
                  : '—'}
              </TableCell>
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
