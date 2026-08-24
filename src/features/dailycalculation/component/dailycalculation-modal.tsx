import { DailyCalculationForm } from './dailycalculation-form'
import { useDailyCalculationRecord } from '#/features/dailycalculation/dailycalculation.hooks'
import type { DailyCalculationRecord } from '#/features/dailycalculation/dailycalculation.types'
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

type DailyCalculationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: DailyCalculationRecord
  onSuccess: () => void
}

export function DailyCalculationModal({
  open,
  onOpenChange,
  record,
  onSuccess,
}: DailyCalculationModalProps) {
  const isEdit = Boolean(record)
  const hasPersonMoney = record?.personMoneyEntries != null
  const recordQuery = useDailyCalculationRecord(
    record?.id,
    open && isEdit && !hasPersonMoney,
  )
  const formRecord = hasPersonMoney ? record : recordQuery.data
  const ready = !isEdit || formRecord?.personMoneyEntries != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Daily Calculation' : 'Create Daily Calculation'}
          </DialogTitle>
          <DialogDescription>
            Enter Tabil and cash by hand. Asol, Sudh, and Deoya are calculated
            from the selected period.
          </DialogDescription>
        </DialogHeader>
        {open && isEdit && recordQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Could not load Daily Calculation</AlertTitle>
            <AlertDescription>{recordQuery.error.message}</AlertDescription>
          </Alert>
        ) : null}
        {open && isEdit && !ready && !recordQuery.isError ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : null}
        {open && ready ? (
          <DailyCalculationForm
            key={formRecord?.id ?? 'new'}
            record={formRecord}
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
