import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import {
  createDailyCalculationSchema,
  updateDailyCalculationSchema,
} from '#/features/dailycalculation/dailycalculation.schema'
import type {
  DailyCalculationPersonMoneyInput,
  DailyCalculationRecord,
} from '#/features/dailycalculation/dailycalculation.types'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

type DailyCalculationFormProps = {
  record?: DailyCalculationRecord
  onSuccess: () => void
  onCancel: () => void
}

function filledPersonMoneyEntries(
  entries: DailyCalculationPersonMoneyInput[],
) {
  return entries
    .map((entry) => ({
      personName: entry.personName.trim(),
      amount: Number(entry.amount),
      remarks: entry.remarks?.trim() || undefined,
    }))
    .filter((entry) => entry.personName && entry.amount > 0)
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

  const [periodStart, setPeriodStart] = useState(
    record ? toDateInput(record.periodStart) : toDateInput(new Date()),
  )
  const [periodEnd, setPeriodEnd] = useState(
    record ? toDateInput(record.periodEnd) : toDateInput(new Date()),
  )
  const [previewPeriod, setPreviewPeriod] = useState({
    periodStart,
    periodEnd,
  })
  const [tabil, setTabil] = useState(record ? String(record.tabil) : '0')
  const [cashInHome, setCashInHome] = useState(
    record ? String(record.cashInHome) : '0',
  )
  const [cashInShop, setCashInShop] = useState(
    record ? String(record.cashInShop) : '0',
  )
  const [personMoneyEntries, setPersonMoneyEntries] = useState<
    DailyCalculationPersonMoneyInput[]
  >(
    record?.personMoneyEntries?.length
      ? record.personMoneyEntries.map((entry) => ({
          personName: entry.personName,
          amount: entry.amount,
          remarks: entry.remarks ?? '',
        }))
      : [emptyPersonMoney()],
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewPeriod({ periodStart, periodEnd })
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
    filledPersonMoneyEntries(personMoneyEntries),
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

  function buildPayload() {
    return {
      periodStart: new Date(`${periodStart}T00:00:00`),
      periodEnd: new Date(`${periodEnd}T00:00:00`),
      tabil: Number(tabil),
      cashInHome: Number(cashInHome),
      cashInShop: Number(cashInShop),
      personMoneyEntries: filledPersonMoneyEntries(personMoneyEntries),
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = buildPayload()

    try {
      if (isEdit && record) {
        const parsed = updateDailyCalculationSchema.parse({
          id: record.id,
          ...payload,
        })
        await updateMutation.mutateAsync(parsed)
      } else {
        const parsed = createDailyCalculationSchema.parse(payload)
        await createMutation.mutateAsync(parsed)
      }
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not save this Daily Calculation.'))
    }
  }

  async function handleClose() {
    if (!record) return
    setError(null)

    try {
      const payload = buildPayload()
      const parsed = updateDailyCalculationSchema.parse({
        id: record.id,
        ...payload,
      })
      await updateMutation.mutateAsync(parsed)
      await closeMutation.mutateAsync({ id: record.id })
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not close this Daily Calculation.'))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
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
            <Field>
              <FieldLabel htmlFor="periodStart">Period start</FieldLabel>
              <Input
                id="periodStart"
                type="date"
                required
                disabled={isEdit}
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="periodEnd">Period end</FieldLabel>
              <Input
                id="periodEnd"
                type="date"
                required
                disabled={isEdit && record?.recordStatus === 'OPEN'}
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tabil">Tabil</FieldLabel>
              <Input
                id="tabil"
                type="number"
                min="0"
                required
                value={tabil}
                onChange={(event) => setTabil(event.target.value)}
              />
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
            <Field>
              <FieldLabel htmlFor="cashInHome">Cash in home</FieldLabel>
              <Input
                id="cashInHome"
                type="number"
                min="0"
                required
                value={cashInHome}
                onChange={(event) => setCashInHome(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cashInShop">Cash in shop</FieldLabel>
              <Input
                id="cashInShop"
                type="number"
                min="0"
                required
                value={cashInShop}
                onChange={(event) => setCashInShop(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DailyCalculationPersonMoneyFields
            entries={personMoneyEntries}
            onChange={setPersonMoneyEntries}
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

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
