import { parseDateInput, toDateInput } from '#/lib/calendar-date'
import { normalizeHeader } from '#/features/admin/admin-csv-core'

export const INTEREST_IMPORT_HEADER_ERROR =
  "Couldn't find a 'SL NO / AMOUNT / SUDH / DATE' header in this file — please check the format."

export type InterestImportHeader = {
  rowIndex: number
  slNoIndex: number
  amountIndex: number
  sudhIndex: number
  dateIndex: number
}

export type ParsedInterestImportRow = {
  rowNumber: number
  slNoRaw: string
  slNo: number | null
  personName: string | null
  sheetAmount: number | null
  sudh: number
  date: string | null
  error: string | null
}

function matchesLabel(value: string, expected: string) {
  return normalizeHeader(value) === normalizeHeader(expected)
}

function isFourColumnInterestHeader(cells: string[], start: number) {
  return (
    matchesLabel(cells[start] ?? '', 'SL NO') &&
    matchesLabel(cells[start + 1] ?? '', 'AMOUNT') &&
    matchesLabel(cells[start + 2] ?? '', 'SUDH') &&
    matchesLabel(cells[start + 3] ?? '', 'DATE')
  )
}

export function parseDelimitedTable(text: string) {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLine = source.split('\n').find((line) => line.trim()) ?? ''
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const delimiter =
    tabCount > commaCount && tabCount > semicolonCount
      ? '\t'
      : semicolonCount > commaCount
        ? ';'
        : ','

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }

    if (char === delimiter) {
      row.push(cell.trim())
      cell = ''
      continue
    }

    if (char === '\n') {
      row.push(cell.trim())
      cell = ''
      rows.push(row)
      row = []
      continue
    }

    cell += char
  }

  if (cell || row.length > 0) {
    row.push(cell.trim())
    rows.push(row)
  }

  return rows
}

export function findInterestImportHeader(table: string[][]): InterestImportHeader {
  for (let rowIndex = 0; rowIndex < table.length; rowIndex += 1) {
    const cells = table[rowIndex] ?? []
    for (let start = 0; start <= cells.length - 4; start += 1) {
      if (isFourColumnInterestHeader(cells, start)) {
        return {
          rowIndex,
          slNoIndex: start,
          amountIndex: start + 1,
          sudhIndex: start + 2,
          dateIndex: start + 3,
        }
      }
    }
  }

  throw new Error(INTEREST_IMPORT_HEADER_ERROR)
}

function cellAt(row: string[], index: number) {
  return (row[index] ?? '').trim()
}

function fourColumnsEmpty(
  row: string[],
  header: InterestImportHeader,
) {
  return (
    !cellAt(row, header.slNoIndex) &&
    !cellAt(row, header.amountIndex) &&
    !cellAt(row, header.sudhIndex) &&
    !cellAt(row, header.dateIndex)
  )
}

export function parseSheetAmount(value: string) {
  const cleaned = value.replace(/[₹rsRS,\s]/g, '').replace(/[^\d.-]/g, '')
  if (!cleaned) return null
  const amount = Number(cleaned)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount)
}

export function parseSlNoCell(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { kind: 'empty' as const }
  }

  const compact = trimmed.replace(/,/g, '').trim()
  if (/^\d+(\.0+)?$/.test(compact)) {
    const slNo = Number(compact)
    if (Number.isInteger(slNo)) {
      return { kind: 'jinis' as const, slNo }
    }
  }

  return { kind: 'person' as const, name: trimmed }
}

function parseYmd(year: number, month: number, day: number) {
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  try {
    return parseDateInput(ymd)
  } catch {
    return null
  }
}

export const INVALID_EXCEL_DATE_SWAP = '__INVALID_EXCEL_DATE_SWAP__'

/**
 * Excel date objects in this import were stored with day/month swapped
 * (03/09/2026 entered under a US locale becomes 9 March). Swap those
 * components. Text DD/MM/YYYY cells must not use this path.
 */
export function swapExcelDateDayAndMonth(ymd: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return null

  const year = Number(match[1])
  const storedMonth = Number(match[2])
  const storedDay = Number(match[3])

  if (storedDay < 1 || storedDay > 12) return null
  if (storedMonth < 1 || storedMonth > 31) return null

  const swapped = parseYmd(year, storedDay, storedMonth)
  return swapped ? toDateInput(swapped) : null
}

export function correctSwappedExcelDate(value: Date) {
  const ymd = toDateInput(value)
  if (!ymd) return INVALID_EXCEL_DATE_SWAP
  return swapExcelDateDayAndMonth(ymd) ?? INVALID_EXCEL_DATE_SWAP
}

/**
 * Interest import dates are always day-first (DD/MM/YYYY).
 * ISO YYYY-MM-DD is accepted only for native Excel date values already
 * converted from the cell, not as a display-format guess.
 */
export function parseInterestImportDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    try {
      return parseDateInput(trimmed)
    } catch {
      return null
    }
  }

  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2])
    const year = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
    return parseYmd(year, month, day)
  }

  const serial = Number(trimmed)
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30 + serial))
    if (Number.isNaN(date.getTime())) return null
    const ymd = toDateInput(date)
    if (!ymd) return null
    try {
      return parseDateInput(ymd)
    } catch {
      return null
    }
  }

  return null
}

export function parseInterestImportRows(table: string[][]) {
  const header = findInterestImportHeader(table)
  const rows: ParsedInterestImportRow[] = []

  for (let index = header.rowIndex + 1; index < table.length; index += 1) {
    const row = table[index] ?? []
    if (fourColumnsEmpty(row, header)) {
      break
    }

    const rowNumber = index + 1
    const slNoRaw = cellAt(row, header.slNoIndex)
    const amountRaw = cellAt(row, header.amountIndex)
    const sudhRaw = cellAt(row, header.sudhIndex)
    const dateRaw = cellAt(row, header.dateIndex)
    const slNoCell = parseSlNoCell(slNoRaw)
    const sheetAmount = amountRaw ? parseSheetAmount(amountRaw) : null
    const sudh = sudhRaw ? parseSheetAmount(sudhRaw) : 0
    const date =
      dateRaw === INVALID_EXCEL_DATE_SWAP
        ? null
        : parseInterestImportDate(dateRaw)
    const errors: string[] = []

    if (slNoCell.kind === 'empty') {
      errors.push('SL No is missing')
    }

    if (sudhRaw && sudh == null) {
      errors.push('Sudh is invalid')
    }

    if (!dateRaw) {
      errors.push('Date is missing')
    } else if (dateRaw === INVALID_EXCEL_DATE_SWAP || !date) {
      errors.push(
        dateRaw === INVALID_EXCEL_DATE_SWAP
          ? 'Date is invalid after correcting day/month'
          : 'Date is invalid',
      )
    }

    rows.push({
      rowNumber,
      slNoRaw,
      slNo: slNoCell.kind === 'jinis' ? slNoCell.slNo : null,
      personName: slNoCell.kind === 'person' ? slNoCell.name : null,
      sheetAmount,
      sudh: sudh ?? 0,
      date: date ? toDateInput(date) : null,
      error: errors.length ? errors.join('. ') : null,
    })
  }

  return rows
}
