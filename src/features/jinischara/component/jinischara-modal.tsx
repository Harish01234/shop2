import { JinisCharaForm } from './jinischara-form'
import type { JinisCharaRecord } from '#/features/jinischara/jinischara.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type JinisCharaModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jinisChara?: JinisCharaRecord
  onSuccess: () => void
}

export function JinisCharaModal({
  open,
  onOpenChange,
  jinisChara,
  onSuccess,
}: JinisCharaModalProps) {
  const isEdit = Boolean(jinisChara)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit JinisChara' : 'Create JinisChara'}
          </DialogTitle>
          <DialogDescription>
            Percentage loan record. Description is optional.
          </DialogDescription>
        </DialogHeader>
        <JinisCharaForm
          key={jinisChara?.id ?? 'new'}
          jinisChara={jinisChara}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onSuccess()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
