import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { AlertCircleIcon } from 'lucide-react'

import {
  useCreateJinisChara,
  useUpdateJinisChara,
} from '#/features/jinischara/jinischara.hooks'
import { createJinisCharaSchema } from '#/features/jinischara/jinischara.schema'
import type { JinisCharaRecord } from '#/features/jinischara/jinischara.types'
import {
  getErrorMessage,
  DEFAULT_JINISCHARA_PERCENTAGE,
} from '#/features/jinischara/jinischara.utils'
import { toDateInput } from '#/lib/calendar-date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  RequiredMark,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

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
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<
    z.input<typeof createJinisCharaSchema>,
    unknown,
    z.output<typeof createJinisCharaSchema>
  >({
    resolver: zodResolver(createJinisCharaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      slNo: jinisChara?.slNo,
      name: jinisChara?.name ?? '',
      fatherName: jinisChara?.fatherName ?? '',
      phoneNo: jinisChara?.phoneNo ?? '',
      credit: jinisChara?.credit,
      percentage: jinisChara?.percentage ?? DEFAULT_JINISCHARA_PERCENTAGE,
      description: jinisChara?.description ?? '',
      date: toDateInput(jinisChara?.date) || toDateInput(new Date()),
      active: jinisChara?.active ?? true,
    },
  })

  async function onSubmit(values: z.output<typeof createJinisCharaSchema>) {
    setServerError(null)
    try {
      if (isEdit && jinisChara) {
        await updateMutation.mutateAsync({ id: jinisChara.id, ...values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onSuccess()
    } catch (caught) {
      setServerError(getErrorMessage(caught, 'Could not save this JinisChara.'))
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
            <Field data-invalid={Boolean(errors.percentage) || undefined}>
              <FieldLabel htmlFor="percentage">Percentage</FieldLabel>
              <Input
                id="percentage"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(errors.percentage)}
                {...form.register('percentage')}
              />
              <FieldError errors={[errors.percentage]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" placeholder="Optional notes" {...form.register('description')} />
            </Field>
          </FieldGroup>
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
          {isEdit ? 'Save changes' : 'Create JinisChara'}
        </Button>
      </div>
    </form>
  )
}
