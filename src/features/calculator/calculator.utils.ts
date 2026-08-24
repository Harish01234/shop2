import { addMonths, differenceInCalendarDays, differenceInMonths } from 'date-fns'

import { parseDateInput, toDateInput } from '#/lib/calendar-date'

export const INTEREST_RATE_OPTIONS = [2, 2.5, 3] as const
export const COMPOUNDING_MONTH_OPTIONS = [12, 6] as const

export type InterestRateOption = (typeof INTEREST_RATE_OPTIONS)[number]
export type CompoundingMonths = (typeof COMPOUNDING_MONTH_OPTIONS)[number]

export function toDayValue(value: Date) {
  return toDateInput(value)
}

export function parseDayValue(value: string) {
  try {
    return parseDateInput(value)
  } catch {
    return null
  }
}

export function todayDayValue() {
  return toDateInput(new Date())
}

/** Full months between the dates; any leftover day rounds up to the next month. */
export function countRoundedUpMonths(start: Date, end: Date) {
  if (end.getTime() < start.getTime()) {
    throw new Error('End Date must be on or after Start Date.')
  }

  const fullMonths = differenceInMonths(end, start)
  const exactMonthEnd = addMonths(start, fullMonths)
  if (exactMonthEnd.getTime() < end.getTime()) {
    return fullMonths + 1
  }
  return fullMonths
}

/**
 * Nominal monthly rate, compounded every `compoundingMonths`.
 * Leftover months that do not fill a cycle earn simple interest on the
 * then-current amount.
 */
export function calculateInterestEarned(
  credit: number,
  monthlyRatePercent: number,
  roundedUpMonths: number,
  compoundingMonths: CompoundingMonths,
) {
  const monthlyRate = monthlyRatePercent / 100
  const fullCycles = Math.floor(roundedUpMonths / compoundingMonths)
  const leftoverMonths = roundedUpMonths % compoundingMonths
  const afterCycles =
    credit * (1 + monthlyRate * compoundingMonths) ** fullCycles
  return afterCycles * (1 + monthlyRate * leftoverMonths) - credit
}

export type CreditInterestInput = {
  credit: number
  monthlyRatePercent: number
  compoundingMonths: CompoundingMonths
  startDate: string
  endDate: string
}

export type ElapsedDuration = {
  years: number
  months: number
  leftoverDays: number
}

export type CreditInterestResult = {
  days: number
  roundedUpMonths: number
  interestEarned: number
  elapsed: ElapsedDuration
}

export function describeElapsedDuration(start: Date, end: Date): ElapsedDuration {
  const fullMonths = differenceInMonths(end, start)
  const exactMonthEnd = addMonths(start, fullMonths)
  return {
    years: Math.floor(fullMonths / 12),
    months: fullMonths % 12,
    leftoverDays: differenceInCalendarDays(end, exactMonthEnd),
  }
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatElapsedDuration(elapsed: ElapsedDuration) {
  const parts: string[] = []
  if (elapsed.years > 0) parts.push(pluralize(elapsed.years, 'year', 'years'))
  if (elapsed.months > 0) parts.push(pluralize(elapsed.months, 'month', 'months'))
  if (elapsed.leftoverDays > 0) {
    parts.push(pluralize(elapsed.leftoverDays, 'day', 'days'))
  }
  return parts.length > 0 ? parts.join(' ') : '0 days'
}

export function formatDurationSentence(
  elapsed: ElapsedDuration,
  roundedUpMonths: number,
) {
  return `${formatElapsedDuration(elapsed)} — rounded up to ${pluralize(roundedUpMonths, 'month', 'months')}`
}

export function calculateCreditInterest(
  input: CreditInterestInput,
): CreditInterestResult {
  if (!Number.isFinite(input.credit) || input.credit <= 0) {
    throw new Error('Enter a credit amount greater than 0.')
  }

  const start = parseDayValue(input.startDate)
  const end = parseDayValue(input.endDate)
  if (!start || !end) {
    throw new Error('Pick a valid Start Date and End Date.')
  }

  const roundedUpMonths = countRoundedUpMonths(start, end)

  return {
    days: differenceInCalendarDays(end, start),
    roundedUpMonths,
    elapsed: describeElapsedDuration(start, end),
    interestEarned: calculateInterestEarned(
      input.credit,
      input.monthlyRatePercent,
      roundedUpMonths,
      input.compoundingMonths,
    ),
  }
}

export function formatCalculatorMoney(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
