import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { AlertCircleIcon } from 'lucide-react'

import { emptyItem, JinisItemFields } from './jinis-item-fields'
import { useCreateJinis, useUpdateJinis } from '#/features/jinis/jinis.hooks'
import { createJinisSchema } from '#/features/jinis/jinis.schema'
import type { JinisRecord } from '#/features/jinis/jinis.types'
import { getErrorMessage, sumJinisWeights } from '#/features/jinis/jinis.utils'
import { toDateInput } from '#/lib/calendar-date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel, RequiredMark } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'

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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<
    z.input<typeof createJinisSchema>,
    unknown,
    z.output<typeof createJinisSchema>
  >({
    resolver: zodResolver(createJinisSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      slNo: jinis?.slNo,
      name: jinis?.name ?? '',
      fatherName: jinis?.fatherName ?? '',
      phoneNo: jinis?.phoneNo ?? '',
      credit: jinis?.credit,
      type: jinis?.type ?? 'GOLD',
      date: toDateInput(jinis?.date) || toDateInput(new Date()),
      active: jinis?.active ?? true,
      items: jinis?.items?.length
        ? jinis.items.map((item) => ({
            name: item.name,
            wet: item.wet,
            type: item.type,
          }))
        : [emptyItem()],
    },
  })

  const itemsArray = useFieldArray({
    control: form.control,
    name: 'items',
  })
  const items = form.watch('items')
  const weights = sumJinisWeights(items ?? [])

  async function onSubmit(values: z.output<typeof createJinisSchema>) {
    setServerError(null)
    try {
      if (isEdit && jinis) {
        await updateJinisMutation.mutateAsync({ id: jinis.id, ...values })
      } else {
        await createJinisMutation.mutateAsync(values)
      }
      onSuccess()
    } catch (caught) {
      setServerError(getErrorMessage(caught, 'Could not save this Jinis.'))
    }
  }

  const errors = form.formState.errors

  return (
    <form
      onSubmit={form.handleSubmit((values) => void onSubmit(values))}
      className="flex flex-col gap-4"
    >
      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.slNo) || undefined}>
              <FieldLabel htmlFor="slNo">
                Serial no <RequiredMark />
              </FieldLabel>
              <Input
                id="slNo"
                type="number"
                min="1"
                aria-invalid={Boolean(errors.slNo)}
                {...form.register('slNo')}
              />
              <FieldError errors={[errors.slNo]} />
            </Field>
            <Field data-invalid={Boolean(errors.date) || undefined}>
              <FieldLabel htmlFor="date">
                Date <RequiredMark />
              </FieldLabel>
              <Input
                id="date"
                type="date"
                aria-invalid={Boolean(errors.date)}
                {...form.register('date')}
              />
              <FieldError errors={[errors.date]} />
            </Field>
            <Field data-invalid={Boolean(errors.name) || undefined}>
              <FieldLabel htmlFor="name">
                Name <RequiredMark />
              </FieldLabel>
              <Input
                id="name"
                aria-invalid={Boolean(errors.name)}
                {...form.register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.fatherName) || undefined}>
              <FieldLabel htmlFor="fatherName">
                Father name <RequiredMark />
              </FieldLabel>
              <Input
                id="fatherName"
                aria-invalid={Boolean(errors.fatherName)}
                {...form.register('fatherName')}
              />
              <FieldError errors={[errors.fatherName]} />
            </Field>
            <Field data-invalid={Boolean(errors.phoneNo) || undefined}>
              <FieldLabel htmlFor="phoneNo">
                Phone <RequiredMark />
              </FieldLabel>
              <Input
                id="phoneNo"
                aria-invalid={Boolean(errors.phoneNo)}
                {...form.register('phoneNo')}
              />
              <FieldError errors={[errors.phoneNo]} />
            </Field>
            <Field data-invalid={Boolean(errors.credit) || undefined}>
              <FieldLabel htmlFor="credit">
                Loan amount <RequiredMark />
              </FieldLabel>
              <Input
                id="credit"
                type="number"
                min="1"
                aria-invalid={Boolean(errors.credit)}
                {...form.register('credit')}
              />
              <FieldError errors={[errors.credit]} />
            </Field>
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(errors.type) || undefined}
            >
              <FieldLabel htmlFor="type">
                Jinis type <RequiredMark />
              </FieldLabel>
              <NativeSelect
                id="type"
                className="w-full max-w-xs"
                aria-invalid={Boolean(errors.type)}
                {...form.register('type')}
              >
                <NativeSelectOption value="GOLD">Gold</NativeSelectOption>
                <NativeSelectOption value="SILVER">Silver</NativeSelectOption>
                <NativeSelectOption value="BOTH">Both</NativeSelectOption>
                <NativeSelectOption value="UNKNOWN">Unknown</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={[errors.type]} />
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
          <JinisItemFields
            fields={itemsArray.fields}
            register={form.register}
            errors={errors}
            onAdd={() => itemsArray.append(emptyItem())}
            onRemove={(index) => itemsArray.remove(index)}
          />
          <FieldError errors={[errors.items]} />
        </CardContent>
      </Card>

      {serverError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
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
