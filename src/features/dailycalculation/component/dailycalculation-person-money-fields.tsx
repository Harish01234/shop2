import { PlusIcon, TrashIcon } from 'lucide-react'

import type { DailyCalculationPersonMoneyInput } from '#/features/dailycalculation/dailycalculation.types'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const emptyPersonMoney = (): DailyCalculationPersonMoneyInput => ({
  personName: '',
  amount: 0,
  remarks: '',
})

export function DailyCalculationPersonMoneyFields({
  entries,
  onChange,
}: {
  entries: DailyCalculationPersonMoneyInput[]
  onChange: (entries: DailyCalculationPersonMoneyInput[]) => void
}) {
  function updateEntry(
    index: number,
    patch: Partial<DailyCalculationPersonMoneyInput>,
  ) {
    onChange(
      entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_7rem_1fr_auto]"
        >
          <Field>
            <FieldLabel htmlFor={`person-name-${index}`}>Person</FieldLabel>
            <Input
              id={`person-name-${index}`}
              value={entry.personName}
              onChange={(event) =>
                updateEntry(index, { personName: event.target.value })
              }
              placeholder="Name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`person-amount-${index}`}>Amount</FieldLabel>
            <Input
              id={`person-amount-${index}`}
              type="number"
              min="0"
              value={String(entry.amount ?? 0)}
              onChange={(event) =>
                updateEntry(index, { amount: Number(event.target.value) })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`person-remarks-${index}`}>Remarks</FieldLabel>
            <Input
              id={`person-remarks-${index}`}
              value={entry.remarks ?? ''}
              onChange={(event) =>
                updateEntry(index, { remarks: event.target.value })
              }
              placeholder="Optional"
            />
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(entries.length === 1 && 'invisible')}
              aria-label="Remove person"
              onClick={() =>
                onChange(entries.filter((_, entryIndex) => entryIndex !== index))
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
        onClick={() => onChange([...entries, emptyPersonMoney()])}
      >
        <PlusIcon />
        Add person
      </Button>
    </div>
  )
}
