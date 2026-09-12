import { formatCalendarDate } from '#/lib/calendar-date'
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import type { JinisRecord, JinisSlNoSort } from '#/features/jinis/jinis.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type JinisTableProps = {
  records: JinisRecord[]
  slNoSort: JinisSlNoSort
  onSlNoSortToggle: () => void
  onCreate: () => void
  onEdit: (record: JinisRecord) => void
  onDelete: (record: JinisRecord) => void
  onToggleActive: (record: JinisRecord, active: boolean) => void
  togglingId?: string | null
}

export function JinisTable({
  records,
  slNoSort,
  onSlNoSortToggle,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
}: JinisTableProps) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No Jinis yet</EmptyTitle>
          <EmptyDescription>
            Create Jinis when you take gold or silver and give a loan.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={onCreate}>
            Create Jinis
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
            <TableHead className="w-[88px]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 gap-1 px-2 font-medium text-foreground"
                onClick={onSlNoSortToggle}
                aria-label={
                  slNoSort === 'desc'
                    ? 'Sort by serial number ascending'
                    : 'Sort by serial number descending'
                }
              >
                No
                {slNoSort === 'desc' ? (
                  <ArrowDownIcon className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowUpIcon className="size-3.5" aria-hidden="true" />
                )}
              </Button>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="text-right">Loan</TableHead>
            <TableHead className="w-[112px]">Date</TableHead>
            <TableHead className="w-[96px]">Status</TableHead>
            <TableHead className="sticky right-0 z-10 w-[132px] border-l border-border bg-card text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.slNo}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{record.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.phoneNo}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{record.type}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {record.credit.toLocaleString('en-IN')}
              </TableCell>
              <TableCell>
                {formatCalendarDate(record.date)}
              </TableCell>
              <TableCell>
                <Badge variant={record.active ? 'default' : 'secondary'}>
                  {record.active ? 'Open' : 'Settled'}
                </Badge>
              </TableCell>
              <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${record.name}`}
                    onClick={() => onEdit(record)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${record.name}`}
                    onClick={() => onDelete(record)}
                  >
                    <Trash2Icon />
                  </Button>
                  <Switch
                    checked={record.active}
                    disabled={togglingId === record.id}
                    aria-label={`Toggle ${record.name} active status`}
                    onCheckedChange={(active) => onToggleActive(record, active)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
