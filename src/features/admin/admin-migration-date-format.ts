export const MIGRATION_DATE_ORDER_STORAGE_KEY =
  'admin-migration-csv-date-order'

export type CsvDateOrder = 'auto' | 'dmy' | 'mdy' | 'ymd'

export const CSV_DATE_ORDER_OPTIONS: {
  value: CsvDateOrder
  label: string
  hint: string
}[] = [
  {
    value: 'auto',
    label: 'Auto-detect',
    hint: 'Best guess for mixed files (same as before).',
  },
  {
    value: 'dmy',
    label: 'Day / Month / Year',
    hint: 'e.g. 25/08/2026 (DD/MM/YYYY)',
  },
  {
    value: 'mdy',
    label: 'Month / Day / Year',
    hint: 'e.g. 08/25/2026 (MM/DD/YYYY)',
  },
  {
    value: 'ymd',
    label: 'Year / Month / Day',
    hint: 'e.g. 2026-08-25 or 2026/08/25',
  },
]

export function readStoredCsvDateOrder(): CsvDateOrder {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem(MIGRATION_DATE_ORDER_STORAGE_KEY)
  if (stored === 'dmy' || stored === 'mdy' || stored === 'ymd' || stored === 'auto') {
    return stored
  }
  return 'auto'
}

export function storeCsvDateOrder(order: CsvDateOrder) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MIGRATION_DATE_ORDER_STORAGE_KEY, order)
}

export type CsvParseOptions = {
  dateOrder?: CsvDateOrder
}
