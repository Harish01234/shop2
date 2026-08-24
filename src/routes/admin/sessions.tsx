import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { AdminSessionsTable } from '#/features/admin/admin-sessions-table'
import {
  useAdminSessions,
  useRevokeSession,
} from '#/features/admin/admin.hooks'
import { adminSessionsQueryOptions } from '#/features/admin/admin.queries'
import type { AdminSessionRecord } from '#/features/admin/admin.types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/sessions')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminSessionsQueryOptions()),
  component: AdminSessionsPage,
})

function AdminSessionsPage() {
  const sessionsQuery = useAdminSessions()
  const revokeSessionMutation = useRevokeSession()
  const [target, setTarget] = useState<AdminSessionRecord | null>(null)

  async function confirmRevoke() {
    if (!target) return
    const record = target
    setTarget(null)
    await revokeSessionMutation.mutateAsync(record).catch(() => {})
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Login sessions. End a session to sign that device out.
        </p>
      </div>

      <AdminSessionsTable
        records={sessionsQuery.data ?? []}
        onRevoke={setTarget}
        revokingId={
          revokeSessionMutation.isPending
            ? (revokeSessionMutation.variables?.id ?? null)
            : null
        }
      />

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {target
                ? `${target.userName} will be signed out on that device.`
                : 'This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmRevoke()}
            >
              {revokeSessionMutation.isPending ? <Spinner /> : null}
              End session
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
