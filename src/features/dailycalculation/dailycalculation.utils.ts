import { format } from 'date-fns'

import type {
  DailyCalculationBalanceStatus,
  DailyCalculationRecordStatus,
} from './dailycalculation.types'

export function sumPersonMoneyTotal(entries: { amount: number }[]) {
  return entries.reduce((total, entry) => total + entry.amount, 0)
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

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function toDateInput(value: Date | string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatMoney(value: number) {
  return value.toLocaleString('en-IN')
}

export function formatPeriod(start: Date | string, end: Date | string) {
  return `${format(new Date(start), 'dd MMM yyyy')} – ${format(new Date(end), 'dd MMM yyyy')}`
}

export function formatPeriodLabel(
  start: Date | string,
  end: Date | string,
  recordStatus: DailyCalculationRecordStatus,
) {
  const startLabel = format(new Date(start), 'dd MMM yyyy')
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
