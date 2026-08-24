import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { AlertCircleIcon } from 'lucide-react'

import {
  DailyCalculationPersonMoneyFields,
  emptyPersonMoney,
} from './dailycalculation-person-money-fields'
import {
  useCloseDailyCalculation,
  useCreateDailyCalculation,
  usePreviewDailyCalculation,
  useUpdateDailyCalculation,
} from '#/features/dailycalculation/dailycalculation.hooks'
import { createDailyCalculationSchema } from '#/features/dailycalculation/dailycalculation.schema'
import type { DailyCalculationRecord } from '#/features/dailycalculation/dailycalculation.types'
import {
  deriveDailyCalculationTotals,
  formatMoney,
  getErrorMessage,
  sumPersonMoneyTotal,
  toDateInput,
} from '#/features/dailycalculation/dailycalculation.utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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

type DailyCalculationFormProps = {
  record?: DailyCalculationRecord
  onSuccess: () => void
  onCancel: () => void
}

export function DailyCalculationForm({
  record,
  onSuccess,
  onCancel,
}: DailyCalculationFormProps) {
  const isEdit = Boolean(record)
  const createMutation = useCreateDailyCalculation()
  const updateMutation = useUpdateDailyCalculation()
  const closeMutation = useCloseDailyCalculation()
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    closeMutation.isPending
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<
    z.input<typeof createDailyCalculationSchema>,
    unknown,
    z.output<typeof createDailyCalculationSchema>
  >({
    resolver: zodResolver(createDailyCalculationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      periodStart: toDateInput(record?.periodStart) || toDateInput(new Date()),
      periodEnd: toDateInput(record?.periodEnd) || toDateInput(new Date()),
      tabil: record?.tabil ?? 0,
      cashInHome: record?.cashInHome ?? 0,
      cashInShop: record?.cashInShop ?? 0,
      personMoneyEntries: record?.personMoneyEntries?.length
        ? record.personMoneyEntries.map((entry) => ({
            personName: entry.personName,
            amount: entry.amount,
            remarks: entry.remarks ?? '',
          }))
        : [emptyPersonMoney()],
    },
  })

  const personMoneyArray = useFieldArray({
    control: form.control,
    name: 'personMoneyEntries',
  })

  const periodStart = form.watch('periodStart')
  const periodEnd = form.watch('periodEnd')
  const tabil = form.watch('tabil')
  const cashInHome = form.watch('cashInHome')
  const cashInShop = form.watch('cashInShop')
  const personMoneyEntries = form.watch('personMoneyEntries')

  const [previewPeriod, setPreviewPeriod] = useState({
    periodStart: toDateInput(periodStart),
    periodEnd: toDateInput(periodEnd),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewPeriod({
        periodStart: toDateInput(periodStart),
        periodEnd: toDateInput(periodEnd),
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [periodStart, periodEnd])

  const previewQuery = usePreviewDailyCalculation(
    previewPeriod.periodStart,
    previewPeriod.periodEnd,
  )

  const asol = previewQuery.data?.asol ?? record?.asol ?? 0
  const sudh = previewQuery.data?.sudh ?? record?.sudh ?? 0
  const deoya = previewQuery.data?.deoya ?? record?.deoya ?? 0
  const personMoneyTotal = sumPersonMoneyTotal(
    (personMoneyEntries ?? []).filter(
      (entry) => entry.personName?.trim() && Number(entry.amount) > 0,
    ),
  )
  const derived = useMemo(
    () =>
      deriveDailyCalculationTotals({
        tabil: Number(tabil) || 0,
        asol,
        sudh,
        deoya,
        cashInHome: Number(cashInHome) || 0,
        cashInShop: Number(cashInShop) || 0,
        personMoneyTotal,
      }),
    [tabil, asol, sudh, deoya, cashInHome, cashInShop, personMoneyTotal],
  )

  async function saveValues(values: z.output<typeof createDailyCalculationSchema>) {
    if (isEdit && record) {
      await updateMutation.mutateAsync({ id: record.id, ...values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  async function onSubmit(values: z.output<typeof createDailyCalculationSchema>) {
    setServerError(null)
    try {
      await saveValues(values)
      onSuccess()
    } catch (caught) {
      setServerError(
        getErrorMessage(caught, 'Could not save this Daily Calculation.'),
      )
    }
  }

  async function handleClose() {
    if (!record) return
    setServerError(null)
    const valid = await form.trigger()
    if (!valid) return

    try {
      await saveValues(createDailyCalculationSchema.parse(form.getValues()))
      await closeMutation.mutateAsync({ id: record.id })
      onSuccess()
    } catch (caught) {
      setServerError(
        getErrorMessage(caught, 'Could not close this Daily Calculation.'),
      )
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
          <CardTitle className="text-base">Period</CardTitle>
          <CardDescription>
            Asol, Sudh, and Deoya use only activity inside these dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={Boolean(errors.periodStart) || undefined}>
              <FieldLabel htmlFor="periodStart">
                Period start <RequiredMark />
              </FieldLabel>
              <Input
                id="periodStart"
                type="date"
                disabled={isEdit}
                aria-invalid={Boolean(errors.periodStart)}
                {...form.register('periodStart')}
              />
              <FieldError errors={[errors.periodStart]} />
            </Field>
            <Field data-invalid={Boolean(errors.periodEnd) || undefined}>
              <FieldLabel htmlFor="periodEnd">
                Period end <RequiredMark />
              </FieldLabel>
              <Input
                id="periodEnd"
                type="date"
                disabled={isEdit && record?.recordStatus === 'OPEN'}
                aria-invalid={Boolean(errors.periodEnd)}
                {...form.register('periodEnd')}
              />
              <FieldError errors={[errors.periodEnd]} />
            </Field>
            <Field data-invalid={Boolean(errors.tabil) || undefined}>
              <FieldLabel htmlFor="tabil">
                Tabil <RequiredMark />
              </FieldLabel>
              <Input
                id="tabil"
                type="number"
                min="0"
                aria-invalid={Boolean(errors.tabil)}
                {...form.register('tabil')}
              />
              <FieldError errors={[errors.tabil]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Automatic totals</CardTitle>
          <CardDescription>
            Calculated on the server from settled loans, interest, and new
            credit in this period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="asol">Asol</FieldLabel>
              <Input id="asol" disabled value={formatMoney(asol)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="sudh">Sudh</FieldLabel>
              <Input id="sudh" disabled value={formatMoney(sudh)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="deoya">Deoya</FieldLabel>
              <Input id="deoya" disabled value={formatMoney(deoya)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="leftTotal">Left total</FieldLabel>
              <Input
                id="leftTotal"
                disabled
                value={formatMoney(derived.leftTotal)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actual money</CardTitle>
          <CardDescription>
            Where the money currently is. Right total is cash plus money with
            people.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.cashInHome) || undefined}>
              <FieldLabel htmlFor="cashInHome">
                Cash in home <RequiredMark />
              </FieldLabel>
              <Input
                id="cashInHome"
                type="number"
                min="0"
                aria-invalid={Boolean(errors.cashInHome)}
                {...form.register('cashInHome')}
              />
              <FieldError errors={[errors.cashInHome]} />
            </Field>
            <Field data-invalid={Boolean(errors.cashInShop) || undefined}>
              <FieldLabel htmlFor="cashInShop">
                Cash in shop <RequiredMark />
              </FieldLabel>
              <Input
                id="cashInShop"
                type="number"
                min="0"
                aria-invalid={Boolean(errors.cashInShop)}
                {...form.register('cashInShop')}
              />
              <FieldError errors={[errors.cashInShop]} />
            </Field>
          </FieldGroup>
          <DailyCalculationPersonMoneyFields
            fields={personMoneyArray.fields}
            register={form.register}
            errors={errors}
            onAdd={() => personMoneyArray.append(emptyPersonMoney())}
            onRemove={(index) => personMoneyArray.remove(index)}
          />
        </CardContent>
      </Card>

      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="rightTotal">Right total</FieldLabel>
              <Input
                id="rightTotal"
                disabled
                value={formatMoney(derived.rightTotal)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="difference">Difference</FieldLabel>
              <Input
                id="difference"
                disabled
                value={formatMoney(derived.difference)}
              />
            </Field>
            <Field>
              <FieldLabel>Balance status</FieldLabel>
              <div className="flex h-8 items-center">
                <Badge
                  variant={
                    derived.balanceStatus === 'CORRECT' ? 'default' : 'secondary'
                  }
                >
                  {derived.balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>
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

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="bg-background"
          onClick={onCancel}
        >
          Cancel
        </Button>
        {record?.recordStatus === 'OPEN' ? (
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void handleClose()}
          >
            {closeMutation.isPending ? <Spinner /> : null}
            Close calculation
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {createMutation.isPending || updateMutation.isPending ? (
            <Spinner />
          ) : null}
          {isEdit ? 'Save changes' : 'Create Daily Calculation'}
        </Button>
      </div>
    </form>
  )
}
