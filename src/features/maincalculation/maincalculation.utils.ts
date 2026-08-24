import { formatCalendarDate } from '#/lib/calendar-date'

import type { MainCalculationBalanceStatus } from './maincalculation.types'

export { getErrorMessage } from '#/lib/form-error'
export { toDateInput } from '#/lib/calendar-date'

export function deriveMainCalculationTotals(input: {
  totalTabil: number
  interest: number
  bandak: number
  jinisChara: number
  cash: number
}) {
  const leftTotal = input.totalTabil + input.interest
  const rightTotal = input.bandak + input.jinisChara + input.cash
  const difference = leftTotal - rightTotal
  const balanceStatus: MainCalculationBalanceStatus =
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

export function balanceStatusBadgeClass(status: MainCalculationBalanceStatus) {
  if (status === 'CORRECT') {
    return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
  }
  return undefined
}
