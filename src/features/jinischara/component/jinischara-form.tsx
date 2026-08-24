import { useState, type FormEvent } from 'react'
import { AlertCircleIcon } from 'lucide-react'

import {
  useCreateJinisChara,
  useUpdateJinisChara,
} from '#/features/jinischara/jinischara.hooks'
import {
  createJinisCharaSchema,
  updateJinisCharaSchema,
} from '#/features/jinischara/jinischara.schema'
import type { JinisCharaRecord } from '#/features/jinischara/jinischara.types'
import { getErrorMessage, DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10)
}

type JinisCharaFormProps = {
  jinisChara?: JinisCharaRecord
  onSuccess: () => void
  onCancel: () => void
}

export function JinisCharaForm({
  jinisChara,
  onSuccess,
  onCancel,
}: JinisCharaFormProps) {
  const isEdit = Boolean(jinisChara)
  const createMutation = useCreateJinisChara()
  const updateMutation = useUpdateJinisChara()
  const saving = createMutation.isPending || updateMutation.isPending

  const [slNo, setSlNo] = useState(jinisChara ? String(jinisChara.slNo) : '')
  const [name, setName] = useState(jinisChara?.name ?? '')
  const [fatherName, setFatherName] = useState(jinisChara?.fatherName ?? '')
  const [phoneNo, setPhoneNo] = useState(jinisChara?.phoneNo ?? '')
  const [credit, setCredit] = useState(jinisChara ? String(jinisChara.credit) : '')
  const [percentage, setPercentage] = useState(
    jinisChara ? String(jinisChara.percentage) : String(DEFAULT_JINISCHARA_PERCENTAGE),
  )
  const [description, setDescription] = useState(jinisChara?.description ?? '')
  const [date, setDate] = useState(
    jinisChara ? toDateInput(jinisChara.date) : toDateInput(new Date()),
  )
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = {
      slNo: Number(slNo),
      name,
      fatherName,
      phoneNo,
      credit: Number(credit),
      percentage: percentage.trim()
        ? Number(percentage)
        : DEFAULT_JINISCHARA_PERCENTAGE,
      description: description.trim() || undefined,
      date: new Date(date),
    }

    try {
      if (isEdit && jinisChara) {
        const parsed = updateJinisCharaSchema.parse({
          id: jinisChara.id,
          ...payload,
        })
        await updateMutation.mutateAsync(parsed)
      } else {
        const parsed = createJinisCharaSchema.parse(payload)
        await createMutation.mutateAsync(parsed)
      }
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not save this JinisChara.'))
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
            <Field>
              <FieldLabel htmlFor="percentage">Percentage</FieldLabel>
              <Input
                id="percentage"
                type="number"
                min="0"
                step="0.01"
                required
                value={percentage}
                onChange={(event) => setPercentage(event.target.value)}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes"
              />
            </Field>
          </FieldGroup>
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
          {isEdit ? 'Save changes' : 'Create JinisChara'}
        </Button>
      </div>
    </form>
  )
}
