import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircleIcon } from 'lucide-react'

import {
  useAvailableDailyCalculations,
  useCreateMainCalculation,
  useFinalizeMainCalculation,
  usePreviewMainCalculation,
  useUpdateMainCalculation,
} from '#/features/maincalculation/maincalculation.hooks'
import {
  createMainCalculationSchema,
  updateMainCalculationSchema,
} from '#/features/maincalculation/maincalculation.schema'
import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'
import {
  balanceStatusBadgeClass,
  formatMoney,
  formatPeriod,
  getErrorMessage,
  toDateInput,
} from '#/features/maincalculation/maincalculation.utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

type MainCalculationFormProps = {
  record?: MainCalculationRecord
  onSuccess: () => void
  onCancel: () => void
}

export function MainCalculationForm({
  record,
  onSuccess,
  onCancel,
}: MainCalculationFormProps) {
  const isEdit = Boolean(record)
  const createMutation = useCreateMainCalculation()
  const updateMutation = useUpdateMainCalculation()
  const finalizeMutation = useFinalizeMainCalculation()
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    finalizeMutation.isPending

  const [calculationDate, setCalculationDate] = useState(
    record ? toDateInput(record.calculationDate) : toDateInput(new Date()),
  )
  const [totalTabil, setTotalTabil] = useState(
    record ? String(record.totalTabil) : '0',
  )
  const [dailyCalculationId, setDailyCalculationId] = useState(
    record?.dailyCalculationId ?? '',
  )
  const [previewInput, setPreviewInput] = useState({
    calculationDate,
    totalTabil: Number(totalTabil) || 0,
    dailyCalculationId,
    excludeMainCalculationId: record?.id,
  })
  const [error, setError] = useState<string | null>(null)
  const [finalizeOpen, setFinalizeOpen] = useState(false)

  const availableQuery = useAvailableDailyCalculations(record?.id)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewInput({
        calculationDate,
        totalTabil: Number(totalTabil) || 0,
        dailyCalculationId,
        excludeMainCalculationId: record?.id,
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [calculationDate, totalTabil, dailyCalculationId, record?.id])

  useEffect(() => {
    const options = availableQuery.data ?? []
    const selected = options.find((option) => option.id === dailyCalculationId)
    if (selected?.isAvailable) return

    const firstAvailable = options.find((option) => option.isAvailable)
    if (firstAvailable) {
      setDailyCalculationId(firstAvailable.id)
    }
  }, [availableQuery.data, dailyCalculationId])

  const previewQuery = usePreviewMainCalculation(
    previewInput.calculationDate,
    previewInput.totalTabil,
    previewInput.dailyCalculationId,
    previewInput.excludeMainCalculationId,
  )

  const totals = previewQuery.data
  const balanceStatus =
    totals?.balanceStatus ?? record?.balanceStatus ?? 'INCORRECT'

  function buildPayload() {
    return {
      calculationDate: new Date(`${calculationDate}T00:00:00`),
      totalTabil: Number(totalTabil),
      dailyCalculationId,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = buildPayload()

    try {
      if (isEdit && record) {
        const parsed = updateMainCalculationSchema.parse({
          id: record.id,
          ...payload,
        })
        await updateMutation.mutateAsync(parsed)
      } else {
        const parsed = createMainCalculationSchema.parse(payload)
        await createMutation.mutateAsync(parsed)
      }
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not save this Main Calculation.'))
    }
  }

  async function confirmFinalize() {
    if (!record) return
    setFinalizeOpen(false)
    setError(null)

    try {
      const payload = buildPayload()
      const parsed = updateMainCalculationSchema.parse({
        id: record.id,
        ...payload,
      })
      await updateMutation.mutateAsync(parsed)
      await finalizeMutation.mutateAsync({ id: record.id })
      onSuccess()
    } catch (caught) {
      setError(
        getErrorMessage(caught, 'Could not finalize this Main Calculation.'),
      )
    }
  }

  const dailyOptions = availableQuery.data ?? []
  const selectableOptions = dailyOptions.filter((option) => option.isAvailable)
  const canSubmit = Boolean(
    dailyCalculationId &&
      selectableOptions.some((option) => option.id === dailyCalculationId),
  )

  return (
    <>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid gap-4 lg:grid-cols-2"
      >
        <Card className="shadow-none ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>
              Link an open Daily Calculation and enter Total Tabil by hand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="calculationDate">Calculation date</FieldLabel>
                <Input
                  id="calculationDate"
                  type="date"
                  required
                  value={calculationDate}
                  onChange={(event) => setCalculationDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dailyCalculationId">
                  Daily Calculation
                </FieldLabel>
                <NativeSelect
                  id="dailyCalculationId"
                  className="w-full"
                  required
                  value={dailyCalculationId}
                  disabled={availableQuery.isPending}
                  onChange={(event) => setDailyCalculationId(event.target.value)}
                >
                  <NativeSelectOption value="" disabled>
                    {availableQuery.isPending
                      ? 'Loading…'
                      : selectableOptions.length
                        ? 'Select an open Daily Calculation'
                        : 'No open Daily Calculation available'}
                  </NativeSelectOption>
                  {dailyOptions.map((option) => (
                    <NativeSelectOption
                      key={option.id}
                      value={option.id}
                      disabled={!option.isAvailable}
                    >
                      {formatPeriod(option.periodStart, option.periodEnd)}
                      {option.isAvailable ? '' : ' (already linked)'}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {availableQuery.isError ? (
                  <p className="text-sm text-destructive">
                    {getErrorMessage(
                      availableQuery.error,
                      'Could not load Daily Calculations.',
                    )}
                  </p>
                ) : null}
                {!availableQuery.isPending && dailyOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Open a Daily Calculation first, then return here.{' '}
                    <Link
                      to="/admin/daily-calculation"
                      search={{ view: 'open' }}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Go to Daily Calculation
                    </Link>
                  </p>
                ) : null}
                {!availableQuery.isPending &&
                dailyOptions.length > 0 &&
                selectableOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Every open Daily Calculation is already linked to a Main
                    Calculation.
                  </p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="totalTabil">Total Tabil</FieldLabel>
                <Input
                  id="totalTabil"
                  type="number"
                  min="0"
                  required
                  value={totalTabil}
                  onChange={(event) => setTotalTabil(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="shadow-none ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>
              Interest and Cash come from the linked Daily Calculation. Bandak
              matches Total Active Jinis Credit. Jinis Chara uses outstanding
              credit as of the calculation date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Interest</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(totals?.interest ?? record?.interest ?? 0)}
                />
              </Field>
              <Field>
                <FieldLabel>Bandak</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(totals?.bandak ?? record?.bandak ?? 0)}
                />
              </Field>
              <Field>
                <FieldLabel>Jinis Chara</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(
                    totals?.jinisChara ?? record?.jinisChara ?? 0,
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Cash</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(totals?.cash ?? record?.cash ?? 0)}
                />
              </Field>
              <Field>
                <FieldLabel>Left total</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(totals?.leftTotal ?? record?.leftTotal ?? 0)}
                />
              </Field>
              <Field>
                <FieldLabel>Right total</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(
                    totals?.rightTotal ?? record?.rightTotal ?? 0,
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Difference</FieldLabel>
                <Input
                  disabled
                  value={formatMoney(
                    totals?.difference ?? record?.difference ?? 0,
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Balance status</FieldLabel>
                <div className="flex h-8 items-center gap-2">
                  {previewQuery.isFetching ? <Spinner /> : null}
                  <Badge
                    variant={
                      balanceStatus === 'INCORRECT' ? 'destructive' : 'outline'
                    }
                    className={cn(balanceStatusBadgeClass(balanceStatus))}
                  >
                    {balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive" className="lg:col-span-2">
            <AlertCircleIcon />
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 lg:col-span-2">
          <Button
            type="button"
            variant="outline"
            className="bg-background"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {record?.recordStatus === 'DRAFT' ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setFinalizeOpen(true)}
            >
              Finalize
            </Button>
          ) : null}
          <Button type="submit" disabled={saving || !canSubmit}>
            {saving ? <Spinner /> : null}
            {isEdit ? 'Save changes' : 'Create Main Calculation'}
          </Button>
        </div>
      </form>

      <AlertDialog open={finalizeOpen} onOpenChange={(open) => {
        if (!open && !saving) setFinalizeOpen(false)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize this Main Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              Totals will be recalculated from the latest data, then marked
              FINALIZED. You can still edit it afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={saving}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void confirmFinalize()}
            >
              {finalizeMutation.isPending ? <Spinner /> : null}
              Finalize
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
