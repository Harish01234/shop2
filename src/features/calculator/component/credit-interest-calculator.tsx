import { useEffect, useState, type FormEvent } from 'react'

import {
  COMPOUNDING_MONTH_OPTIONS,
  INTEREST_RATE_OPTIONS,
  calculateCreditInterest,
  formatCalculatorMoney,
  formatElapsedDuration,
  todayDayValue,
  type CompoundingMonths,
  type CreditInterestResult,
  type InterestRateOption,
} from '#/features/calculator/calculator.utils'
import { FriendlyDatePicker } from '#/features/calculator/component/friendly-date-picker'
import {
  JinisSlNoCombobox,
  mergeJinisSlNoOption,
} from '#/features/jinis/component/jinis-sl-no-combobox'
import { useJinisCalculatorLookup } from '#/features/jinis/jinis.hooks'
import type { JinisCalculatorLookupOption } from '#/features/jinis/jinis.types'
import { toDateInput } from '#/lib/calendar-date'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'

const SETTLED_JINIS_MESSAGE =
  'This Jinis is already settled — interest is not applicable.'

export function CreditInterestCalculator() {
  const [jinisQuery, setJinisQuery] = useState('')
  const [debouncedJinisQuery, setDebouncedJinisQuery] = useState('')
  const [selectedJinisId, setSelectedJinisId] = useState('')
  const [selectedJinis, setSelectedJinis] =
    useState<JinisCalculatorLookupOption | null>(null)
  const [credit, setCredit] = useState('')
  const [interestRate, setInterestRate] = useState<InterestRateOption>(2)
  const [compoundingMonths, setCompoundingMonths] =
    useState<CompoundingMonths>(12)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(todayDayValue)
  const [error, setError] = useState<string | null>(null)
  const [settledMessage, setSettledMessage] = useState<string | null>(null)
  const [result, setResult] = useState<CreditInterestResult | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedJinisQuery(jinisQuery)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [jinisQuery])

  const shouldFetchJinisLookup =
    debouncedJinisQuery.trim().length > 0 || Boolean(selectedJinisId)
  const jinisLookupQuery = useJinisCalculatorLookup(
    shouldFetchJinisLookup,
    debouncedJinisQuery,
  )
  const jinisOptions = mergeJinisSlNoOption(
    jinisLookupQuery.data ?? [],
    selectedJinis,
  )

  function handleInputChange() {
    setError(null)
    setSettledMessage(null)
    setResult(null)
  }

  function handleJinisSelect(nextId: string) {
    setSelectedJinisId(nextId)
    handleInputChange()

    if (!nextId) {
      setSelectedJinis(null)
      return
    }

    const jinis =
      jinisLookupQuery.data?.find((item) => item.id === nextId) ??
      (selectedJinis?.id === nextId ? selectedJinis : null)

    if (!jinis) return

    setSelectedJinis(jinis)
    setCredit(String(jinis.credit))
    setStartDate(toDateInput(jinis.date))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSettledMessage(null)

    if (selectedJinis && !selectedJinis.active) {
      setResult(null)
      setSettledMessage(SETTLED_JINIS_MESSAGE)
      return
    }

    try {
      setResult(
        calculateCreditInterest({
          credit: Number(credit),
          monthlyRatePercent: interestRate,
          compoundingMonths,
          startDate,
          endDate,
        }),
      )
    } catch (cause) {
      setResult(null)
      setError(
        cause instanceof Error ? cause.message : 'Could not calculate interest.',
      )
    }
  }

  return (
    <Card
      size="sm"
      className="w-full max-w-xl shadow-lg ring-foreground/15"
    >
      <CardHeader className="gap-0.5">
        <CardTitle>Credit Interest Calculator</CardTitle>
        <CardDescription>
          Extra days round up to the next full month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="jinisSlNo">Jinis SL No</FieldLabel>
            <JinisSlNoCombobox
              id="jinisSlNo"
              value={selectedJinisId}
              onValueChange={handleJinisSelect}
              options={jinisOptions}
              placeholder={
                jinisLookupQuery.isLoading ? 'Loading…' : 'Search SL no or name'
              }
              searchPlaceholder="Search SL no or name"
              emptyText={
                debouncedJinisQuery.trim()
                  ? 'No Jinis found.'
                  : 'Type SL no or name to search all Jinis.'
              }
              disabled={jinisLookupQuery.isLoading}
              onQueryChange={setJinisQuery}
            />
          </Field>

          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="credit">Credit</FieldLabel>
              <Input
                id="credit"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required
                value={credit}
                onChange={(event) => {
                  setCredit(event.target.value)
                  handleInputChange()
                }}
                className="h-9"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="interestRate">Interest %</FieldLabel>
              <NativeSelect
                id="interestRate"
                className="w-full"
                value={String(interestRate)}
                onChange={(event) => {
                  setInterestRate(
                    Number(event.target.value) as InterestRateOption,
                  )
                  handleInputChange()
                }}
              >
                {INTEREST_RATE_OPTIONS.map((rate) => (
                  <NativeSelectOption key={rate} value={String(rate)}>
                    {rate}% monthly
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between gap-3">
            <FieldLabel className="shrink-0">Compounding</FieldLabel>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              {COMPOUNDING_MONTH_OPTIONS.map((months) => (
                <Button
                  key={months}
                  type="button"
                  size="sm"
                  variant={compoundingMonths === months ? 'default' : 'ghost'}
                  className="h-7 px-2.5"
                  aria-pressed={compoundingMonths === months}
                  onClick={() => {
                    setCompoundingMonths(months)
                    handleInputChange()
                  }}
                >
                  {months} months
                </Button>
              ))}
            </div>
          </div>

          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
              <FriendlyDatePicker
                id="startDate"
                required
                value={startDate}
                onChange={(next) => {
                  setStartDate(next)
                  handleInputChange()
                }}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="endDate">End Date</FieldLabel>
              <FriendlyDatePicker
                id="endDate"
                required
                value={endDate}
                onChange={(next) => {
                  setEndDate(next)
                  handleInputChange()
                }}
              />
            </Field>
          </FieldGroup>

          {error ? <FieldError>{error}</FieldError> : null}

          <Button type="submit" className="h-9 w-full">
            Calculate
          </Button>
        </form>

        {settledMessage ? (
          <div className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground">
            {settledMessage}
          </div>
        ) : null}

        {result ? (
          <div className="mt-3 space-y-2.5 border-t border-border pt-3">
            <div className="rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
              <p className="text-xs font-medium text-primary-foreground/80">
                Interest Earned
              </p>
              <p className="mt-0.5 font-heading text-3xl font-medium tracking-tight tabular-nums">
                {formatCalculatorMoney(result.interestEarned)}
              </p>
            </div>
            <div>
              <p className="text-pretty text-lg font-medium leading-snug">
                {formatElapsedDuration(result.elapsed)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Rounded up to {result.roundedUpMonths}{' '}
                {result.roundedUpMonths === 1 ? 'month' : 'months'}
                {' · '}
                {result.days.toLocaleString('en-IN')} days
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
