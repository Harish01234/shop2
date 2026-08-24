import { formatCalendarDate } from '#/lib/calendar-date'

import type {
  DailyCalculationBalanceStatus,
  DailyCalculationRecordStatus,
} from './dailycalculation.types'

export { toDateInput } from '#/lib/calendar-date'
export { getErrorMessage } from '#/lib/form-error'

export function sumPersonMoneyTotal(entries: { amount?: unknown }[]) {
  return entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0)
}

export function deriveDailyCalculationTotals(input: {
  tabil: number
  asol: number
  sudh: number
  deoya: number
  cashInHome: number
  cashInShop: number
  personMoneyTotal: number
}) {
  const leftTotal = input.tabil + input.asol + input.sudh - input.deoya
  const rightTotal =
    input.cashInHome + input.cashInShop + input.personMoneyTotal
  const difference = leftTotal - rightTotal
  const balanceStatus: DailyCalculationBalanceStatus =
    difference === 0 ? 'CORRECT' : 'INCORRECT'

  return {
    leftTotal,
    rightTotal,
    difference,
    balanceStatus,
  }
}

export function formatMoney(value: number) {
  return value.toLocaleString('en-IN')
}

export function formatPeriod(start: Date | string, end: Date | string) {
  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`
}

export function formatPeriodLabel(
  start: Date | string,
  end: Date | string,
  recordStatus: DailyCalculationRecordStatus,
) {
  const startLabel = formatCalendarDate(start)
  if (recordStatus === 'OPEN') {
    return `${startLabel} – Ongoing`
  }
  return formatPeriod(start, end)
}

export function balanceStatusBadgeClass(status: DailyCalculationBalanceStatus) {
  if (status === 'CORRECT') {
    return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
  }
  return undefined
}
