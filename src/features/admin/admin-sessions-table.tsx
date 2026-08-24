import { format } from 'date-fns'
import { BanIcon } from 'lucide-react'

import type { AdminSessionRecord } from './admin.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return 'Unknown device'
  if (/mobile/i.test(userAgent)) return 'Mobile'
  if (/edg/i.test(userAgent)) return 'Edge'
  if (/chrome/i.test(userAgent)) return 'Chrome'
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'
  return 'Desktop'
}

type AdminSessionsTableProps = {
  records: AdminSessionRecord[]
  onRevoke: (record: AdminSessionRecord) => void
  revokingId?: string | null
}

export function AdminSessionsTable({
  records,
  onRevoke,
  revokingId,
}: AdminSessionsTableProps) {
  if (records.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No sessions</EmptyTitle>
          <EmptyDescription>
            Login sessions will show up here after people sign in.
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
            <TableHead>User</TableHead>
            <TableHead>Device / IP</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Last active</TableHead>
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
                  <span className="font-medium">{record.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.userEmail}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{deviceLabel(record.userAgent)}</span>
                  <span className="text-xs text-muted-foreground">
                    {record.ipAddress ?? '—'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(record.createdAt), 'dd MMM yyyy HH:mm')}
              </TableCell>
              <TableCell>
                {format(new Date(record.updatedAt), 'dd MMM yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={record.active ? 'default' : 'secondary'}>
                    {record.active ? 'Active' : 'Expired'}
                  </Badge>
                  {record.current ? <Badge variant="outline">You</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="sticky right-0 z-10 border-l border-border bg-card">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={revokingId === record.id || !record.active}
                    aria-label={`End session for ${record.userName}`}
                    onClick={() => onRevoke(record)}
                  >
                    <BanIcon />
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
