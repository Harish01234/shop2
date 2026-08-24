import { MainCalculationForm } from './maincalculation-form'
import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type MainCalculationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: MainCalculationRecord
  onSuccess: () => void
}

export function MainCalculationModal({
  open,
  onOpenChange,
  record,
  onSuccess,
}: MainCalculationModalProps) {
  const isEdit = Boolean(record)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Main Calculation' : 'Create Main Calculation'}
          </DialogTitle>
          <DialogDescription>
            Enter Total Tabil by hand. Interest, Bandak, Jinis Chara, and Cash
            are calculated on the server. You need at least one open Daily
            Calculation to link.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <MainCalculationForm
            key={record?.id ?? 'new'}
            record={record}
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
