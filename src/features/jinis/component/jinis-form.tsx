import { useState, type FormEvent } from 'react'

import { emptyItem, JinisItemFields } from './jinis-item-fields'
import { useCreateJinis, useUpdateJinis } from '#/features/jinis/jinis.hooks'
import { createJinisSchema, updateJinisSchema } from '#/features/jinis/jinis.schema'
import type { JinisItemInput, JinisRecord, JinisType } from '#/features/jinis/jinis.types'
import { getErrorMessage, sumJinisWeights } from '#/features/jinis/jinis.utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircleIcon } from 'lucide-react'

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10)
}

type JinisFormProps = {
  jinis?: JinisRecord
  onSuccess: () => void
  onCancel: () => void
}

export function JinisForm({ jinis, onSuccess, onCancel }: JinisFormProps) {
  const isEdit = Boolean(jinis)
  const createJinisMutation = useCreateJinis()
  const updateJinisMutation = useUpdateJinis()
  const saving = createJinisMutation.isPending || updateJinisMutation.isPending

  const [slNo, setSlNo] = useState(jinis ? String(jinis.slNo) : '')
  const [name, setName] = useState(jinis?.name ?? '')
  const [fatherName, setFatherName] = useState(jinis?.fatherName ?? '')
  const [phoneNo, setPhoneNo] = useState(jinis?.phoneNo ?? '')
  const [credit, setCredit] = useState(jinis ? String(jinis.credit) : '')
  const [type, setType] = useState<JinisType>(jinis?.type ?? 'GOLD')
  const [date, setDate] = useState(
    jinis ? toDateInput(jinis.date) : toDateInput(new Date()),
  )
  const [items, setItems] = useState<JinisItemInput[]>(
    jinis?.items?.length
      ? jinis.items.map((item) => ({
          name: item.name,
          wet: item.wet,
          type: item.type,
        }))
      : [emptyItem()],
  )
  const [error, setError] = useState<string | null>(null)

  const weights = sumJinisWeights(items)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = {
      slNo: Number(slNo),
      name,
      fatherName,
      phoneNo,
      credit: Number(credit),
      type,
      date: new Date(date),
      items: items.map((item) => ({
        ...item,
        wet: Number(item.wet),
      })),
    }

    try {
      if (isEdit && jinis) {
        const parsed = updateJinisSchema.parse({ id: jinis.id, ...payload })
        await updateJinisMutation.mutateAsync(parsed)
      } else {
        const parsed = createJinisSchema.parse(payload)
        await createJinisMutation.mutateAsync(parsed)
      }
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not save this Jinis.'))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4"
    >
      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="slNo">Serial no</FieldLabel>
              <Input
                id="slNo"
                type="number"
                min="1"
                required
                value={slNo}
                onChange={(event) => setSlNo(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fatherName">Father name</FieldLabel>
              <Input
                id="fatherName"
                required
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phoneNo">Phone</FieldLabel>
              <Input
                id="phoneNo"
                required
                value={phoneNo}
                onChange={(event) => setPhoneNo(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="credit">Loan amount</FieldLabel>
              <Input
                id="credit"
                type="number"
                min="1"
                required
                value={credit}
                onChange={(event) => setCredit(event.target.value)}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="type">Jinis type</FieldLabel>
              <NativeSelect
                id="type"
                className="w-full max-w-xs"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as JinisType)
                }
              >
                <NativeSelectOption value="GOLD">Gold</NativeSelectOption>
                <NativeSelectOption value="SILVER">Silver</NativeSelectOption>
                <NativeSelectOption value="BOTH">Both</NativeSelectOption>
                <NativeSelectOption value="UNKNOWN">Unknown</NativeSelectOption>
              </NativeSelect>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Items</CardTitle>
          <CardDescription>
            Gold {weights.goldWeight.toFixed(2)} · Silver{' '}
            {weights.silverWeight.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JinisItemFields items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="bg-background"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner /> : null}
          {isEdit ? 'Save changes' : 'Create Jinis'}
        </Button>
      </div>
    </form>
  )
}
