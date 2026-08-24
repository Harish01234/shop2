import { format } from 'date-fns'

import type { MainCalculationBalanceStatus } from './maincalculation.types'

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

export function balanceStatusBadgeClass(status: MainCalculationBalanceStatus) {
  if (status === 'CORRECT') {
    return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
  }
  return undefined
}
