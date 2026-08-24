import { PlusIcon, TrashIcon } from 'lucide-react'

import type { JinisItemInput } from '#/features/jinis/jinis.types'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

const emptyItem = (): JinisItemInput => ({
  name: '',
  wet: 0,
  type: 'GOLD',
})

export function JinisItemFields({
  items,
  onChange,
}: {
  items: JinisItemInput[]
  onChange: (items: JinisItemInput[]) => void
}) {
  function updateItem(index: number, patch: Partial<JinisItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_7rem_8rem_auto]"
        >
          <Field>
            <FieldLabel htmlFor={`item-name-${index}`}>Item</FieldLabel>
            <Input
              id={`item-name-${index}`}
              value={item.name}
              onChange={(event) =>
                updateItem(index, { name: event.target.value })
              }
              placeholder="Ring, chain"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`item-wet-${index}`}>Weight</FieldLabel>
            <Input
              id={`item-wet-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={item.wet || ''}
              onChange={(event) =>
                updateItem(index, { wet: Number(event.target.value) })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`item-type-${index}`}>Metal</FieldLabel>
            <NativeSelect
              id={`item-type-${index}`}
              className="w-full"
              value={item.type}
              onChange={(event) =>
                updateItem(index, {
                  type: event.target.value as JinisItemInput['type'],
                })
              }
            >
              <NativeSelectOption value="GOLD">Gold</NativeSelectOption>
              <NativeSelectOption value="SILVER">Silver</NativeSelectOption>
            </NativeSelect>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(items.length === 1 && 'invisible')}
              aria-label="Remove item"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-fit bg-background"
        onClick={() => onChange([...items, emptyItem()])}
      >
        <PlusIcon />
        Add item
      </Button>
    </div>
  )
}

export { emptyItem }
