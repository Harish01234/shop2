import { JinisForm } from './jinis-form'
import { useJinisRecord } from '#/features/jinis/jinis.hooks'
import type { JinisRecord } from '#/features/jinis/jinis.types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircleIcon } from 'lucide-react'

type JinisModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jinis?: JinisRecord
  onSuccess: () => void
}

export function JinisModal({
  open,
  onOpenChange,
  jinis,
  onSuccess,
}: JinisModalProps) {
  const isEdit = Boolean(jinis)
  const hasItems = Boolean(jinis?.items)
  const recordQuery = useJinisRecord(jinis?.id, open && isEdit && !hasItems)
  const formRecord = hasItems ? jinis : recordQuery.data
  const ready = !isEdit || Boolean(formRecord?.items)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Jinis' : 'Create Jinis'}</DialogTitle>
          <DialogDescription>
            Loan against gold or silver. Weights are summed from the items.
          </DialogDescription>
        </DialogHeader>
        {open && isEdit && recordQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Could not load Jinis</AlertTitle>
            <AlertDescription>{recordQuery.error.message}</AlertDescription>
          </Alert>
        ) : null}
        {open && isEdit && !ready && !recordQuery.isError ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : null}
        {open && ready ? (
          <JinisForm
            key={formRecord?.id ?? 'new'}
            jinis={formRecord}
            onCancel={() => onOpenChange(false)}
            onSuccess={() => {
              onSuccess()
              onOpenChange(false)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
