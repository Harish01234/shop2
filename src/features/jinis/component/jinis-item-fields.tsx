import { PlusIcon, TrashIcon } from 'lucide-react'
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form'
import type { z } from 'zod'

import { createJinisSchema } from '#/features/jinis/jinis.schema'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel, RequiredMark } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

type JinisFormInput = z.input<typeof createJinisSchema>

export const emptyItem = (): JinisFormInput['items'][number] => ({
  name: '',
  wet: undefined as unknown as number,
  type: 'GOLD',
})

type JinisItemsForm = JinisFormInput

export function JinisItemFields({
  fields,
  register,
  errors,
  onAdd,
  onRemove,
}: {
  fields: FieldArrayWithId<JinisItemsForm, 'items'>[]
  register: UseFormRegister<JinisItemsForm>
  errors: FieldErrors<JinisItemsForm>
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => {
        const itemErrors = errors.items?.[index]

        return (
          <div
            key={field.id}
            className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_7rem_8rem_auto]"
          >
            <Field data-invalid={Boolean(itemErrors?.name) || undefined}>
              <FieldLabel htmlFor={`item-name-${index}`}>
                Item <RequiredMark />
              </FieldLabel>
              <Input
                id={`item-name-${index}`}
                aria-invalid={Boolean(itemErrors?.name)}
                placeholder="Ring, chain"
                {...register(`items.${index}.name`)}
              />
              <FieldError errors={[itemErrors?.name]} />
            </Field>
            <Field data-invalid={Boolean(itemErrors?.wet) || undefined}>
              <FieldLabel htmlFor={`item-wet-${index}`}>
                Weight <RequiredMark />
              </FieldLabel>
              <Input
                id={`item-wet-${index}`}
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(itemErrors?.wet)}
                {...register(`items.${index}.wet`)}
              />
              <FieldError errors={[itemErrors?.wet]} />
            </Field>
            <Field data-invalid={Boolean(itemErrors?.type) || undefined}>
              <FieldLabel htmlFor={`item-type-${index}`}>
                Metal <RequiredMark />
              </FieldLabel>
              <NativeSelect
                id={`item-type-${index}`}
                className="w-full"
                aria-invalid={Boolean(itemErrors?.type)}
                {...register(`items.${index}.type`)}
              >
                <NativeSelectOption value="GOLD">Gold</NativeSelectOption>
                <NativeSelectOption value="SILVER">Silver</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={[itemErrors?.type]} />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(fields.length === 1 && 'invisible')}
                aria-label="Remove item"
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
        Add item
      </Button>
    </div>
  )
}
