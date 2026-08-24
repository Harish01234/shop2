import { InterestForm } from './interest-form'
import type { InterestRecord } from '#/features/interest/interest.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InterestModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  interest?: InterestRecord
  asolContext?: {
    settledCredit: number
    source: 'Jinis' | 'JinisChara'
  }
  defaultDate?: Date | string
  onSuccess: () => void
}

export function InterestModal({
  open,
  onOpenChange,
  interest,
  asolContext,
  defaultDate,
  onSuccess,
}: InterestModalProps) {
  const isEdit = Boolean(interest)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? asolContext
                ? 'Edit Sudh'
                : 'Edit Interest'
              : 'Create Interest'}
          </DialogTitle>
          <DialogDescription>
            {asolContext
              ? 'Update the interest amount for this settled loan. Settled credit cannot be changed here.'
              : 'Record a payment against a Jinis, JinisChara, or person.'}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <InterestForm
            key={interest?.id ?? `new-${defaultDate ?? 'today'}`}
            interest={interest}
            asolContext={asolContext}
            defaultDate={defaultDate}
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
