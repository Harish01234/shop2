import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'

import type { DailyCalculationDetail } from './dailycalculation.types'

export const EXPORT_COLORS = {
  dailyLeft: 'FFF4A896',
  dailyRight: 'FFB5E48C',
  mainLeft: 'FFFFB4D2',
  mainRight: 'FFCDB4DB',
  banner: 'FF2EC4B6',
  deoyaHeader: 'FFFFBF69',
  asolHeader: 'FFFFD166',
  white: 'FFFFFFFF',
  black: 'FF000000',
  grid: 'FFBBBBBB',
} as const

export type ExportSummaryLine = {
  label: string
  value: number | string
  bold?: boolean
}

export function formatExportMoney(value: number) {
  return value.toLocaleString('en-IN')
}

export function exportBannerTitle(periodLabel: string) {
  return `DAILY HISAB — ${periodLabel}`
}

export function dailyLeftSubtotal(detail: DailyCalculationDetail) {
  return detail.tabil + detail.asol + detail.sudh
}

export function buildDailyLeftLines(
  detail: DailyCalculationDetail,
): ExportSummaryLine[] {
  return [
    { label: 'Tabil', value: detail.tabil },
    { label: 'Asol', value: detail.asol },
    { label: 'Sudh', value: detail.sudh },
    {
      label: 'Total',
      value: dailyLeftSubtotal(detail),
      bold: true,
    },
    { label: 'Deoya', value: detail.deoya },
    { label: 'Val1', value: detail.leftTotal, bold: true },
  ]
}

function personMoneyLabel(name: string, remarks: string | null) {
  if (!remarks?.trim()) return name
  return `${name} (${remarks.trim()})`
}

export function buildDailyRightLines(
  detail: DailyCalculationDetail,
): ExportSummaryLine[] {
  const lines: ExportSummaryLine[] = [
    { label: 'Cash in Home', value: detail.cashInHome },
    { label: 'Cash in Shop', value: detail.cashInShop },
  ]

  for (const entry of detail.personMoneyEntries) {
    lines.push({
      label: personMoneyLabel(entry.personName, entry.remarks),
      value: entry.amount,
    })
  }

  lines.push({ label: 'Val2', value: detail.rightTotal, bold: true })
  return lines
}

export function buildMainLeftLines(
  main: MainCalculationRecord | null,
): ExportSummaryLine[] {
  if (!main) return []

  return [
    { label: 'Total Tabil', value: main.totalTabil },
    { label: 'Sudh', value: main.interest },
    { label: 'Val1', value: main.leftTotal, bold: true },
  ]
}

export function buildMainRightLines(
  main: MainCalculationRecord | null,
): ExportSummaryLine[] {
  if (!main) {
    return []
  }

  return [
    { label: 'Bandak', value: main.bandak },
    { label: 'Jinis Chara', value: main.jinisChara },
    { label: 'Cash', value: main.cash },
    { label: 'Val2', value: main.rightTotal, bold: true },
  ]
}
