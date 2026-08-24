import { format } from 'date-fns'
import { PencilIcon, Trash2Icon } from 'lucide-react'

import type { JinisRecord } from '#/features/jinis/jinis.types'
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
  onCreate: () => void
  onEdit: (record: JinisRecord) => void
  onDelete: (record: JinisRecord) => void
  onToggleActive: (record: JinisRecord, active: boolean) => void
  togglingId?: string | null
}

export function JinisTable({
  records,
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
            <TableHead>No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Gold</TableHead>
            <TableHead>Silver</TableHead>
            <TableHead>Loan</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="sticky right-0 z-10 border-l border-border bg-card text-right">
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
              <TableCell>{record.goldWeight.toFixed(2)}</TableCell>
              <TableCell>{record.silverWeight.toFixed(2)}</TableCell>
              <TableCell>{record.credit.toLocaleString('en-IN')}</TableCell>
              <TableCell>
                {format(new Date(record.date), 'dd MMM yyyy')}
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
