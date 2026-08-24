import { formatCalendarDate } from '#/lib/calendar-date'
import { PencilIcon, Trash2Icon } from 'lucide-react'

import type { InterestRecord } from '#/features/interest/interest.types'
import { interestLinkLabel } from '#/features/interest/interest.utils'
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

type InterestTableProps = {
  records: InterestRecord[]
  onCreate: () => void
  onEdit: (record: InterestRecord) => void
  onDelete: (record: InterestRecord) => void
}

export function InterestTable({
  records,
  onCreate,
  onEdit,
  onDelete,
}: InterestTableProps) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No Interest yet</EmptyTitle>
          <EmptyDescription>
            Create Interest when you record a payment against Jinis, JinisChara,
            or a person.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={onCreate}>
            Create Interest
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/15">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Linked to</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="sticky right-0 z-10 border-l border-border bg-card text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.amount.toLocaleString('en-IN')}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{interestLinkLabel(record)}</span>
                  {record.jinis || record.jinisChara ? (
                    <span className="text-xs text-muted-foreground">
                      {record.jinis ? 'Jinis' : 'JinisChara'}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {record.remarks ? (
                  record.remarks
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {formatCalendarDate(record.date)}
              </TableCell>
              <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit Interest"
                    onClick={() => onEdit(record)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete Interest"
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
