import { PlusIcon, TrashIcon } from 'lucide-react'
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form'

import type { z } from 'zod'

import { createDailyCalculationSchema } from '#/features/dailycalculation/dailycalculation.schema'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
  RequiredMark,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DailyCalculationFormValues = z.input<typeof createDailyCalculationSchema>

export const emptyPersonMoney = () => ({
  personName: '',
  amount: 0,
  remarks: '',
})

export function DailyCalculationPersonMoneyFields({
  fields,
  register,
  errors,
  onAdd,
  onRemove,
}: {
  fields: FieldArrayWithId<DailyCalculationFormValues, 'personMoneyEntries'>[]
  register: UseFormRegister<DailyCalculationFormValues>
  errors: FieldErrors<DailyCalculationFormValues>
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => {
        const entryErrors = errors.personMoneyEntries?.[index]

        return (
          <div
            key={field.id}
            className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_7rem_1fr_auto]"
          >
            <Field data-invalid={Boolean(entryErrors?.personName) || undefined}>
              <FieldLabel htmlFor={`person-name-${index}`}>
                Person <RequiredMark />
              </FieldLabel>
              <Input
                id={`person-name-${index}`}
                placeholder="Name"
                aria-invalid={Boolean(entryErrors?.personName)}
                {...register(`personMoneyEntries.${index}.personName`)}
              />
              <FieldError errors={[entryErrors?.personName]} />
            </Field>
            <Field data-invalid={Boolean(entryErrors?.amount) || undefined}>
              <FieldLabel htmlFor={`person-amount-${index}`}>
                Amount <RequiredMark />
              </FieldLabel>
              <Input
                id={`person-amount-${index}`}
                type="number"
                min="0"
                aria-invalid={Boolean(entryErrors?.amount)}
                {...register(`personMoneyEntries.${index}.amount`)}
              />
              <FieldError errors={[entryErrors?.amount]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`person-remarks-${index}`}>Remarks</FieldLabel>
              <Input
                id={`person-remarks-${index}`}
                placeholder="Optional"
                {...register(`personMoneyEntries.${index}.remarks`)}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(fields.length === 1 && 'invisible')}
                aria-label="Remove person"
                onClick={() => onRemove(index)}
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        className="w-fit bg-background"
        onClick={onAdd}
      >
        <PlusIcon />
        Add person
      </Button>
    </div>
  )
}
