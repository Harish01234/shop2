import { parseDateInput } from '#/lib/calendar-date'
import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'

import type { CsvDateOrder } from './admin-migration-date-format'

export function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function parseCsvTable(text: string) {
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
      if (row.some((value) => value !== '')) {
        rows.push(row)
      }
      row = []
      continue
    }

    cell += char
  }

  if (cell || row.length > 0) {
    row.push(cell.trim())
    if (row.some((value) => value !== '')) {
      rows.push(row)
    }
  }

  return rows
}

export function headerIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header))
}

export function parseCredit(value: string) {
  const cleaned = value.replace(/[₹rsRS,\s]/g, '').replace(/[^\d.-]/g, '')
  if (!cleaned) return null
  const amount = Number(cleaned)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(amount)
}

export function parsePercentage(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { value: DEFAULT_JINISCHARA_PERCENTAGE, invalid: false }
  }

  const cleaned = trimmed.replace(/[^\d.-]/g, '')
  if (!cleaned) return { value: null, invalid: true }

  const amount = Number(cleaned)
  if (!Number.isFinite(amount) || amount < 0) {
    return { value: null, invalid: true }
  }

  return { value: amount, invalid: false }
}

export type ParseDateOptions = {
  dateOrder?: CsvDateOrder
}

function parseYmdParts(year: number, month: number, day: number) {
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  try {
    return parseDateInput(ymd)
  } catch {
    return null
  }
}

function parseSlashParts(
  first: number,
  second: number,
  year: number,
  dateOrder: CsvDateOrder,
) {
  let day: number
  let month: number

  if (dateOrder === 'dmy') {
    day = first
    month = second
  } else if (dateOrder === 'mdy') {
    month = first
    day = second
  } else {
    const dayFirst = first > 12 || second <= 12
    day = dayFirst ? first : second
    month = dayFirst ? second : first
  }

  return parseYmdParts(year, month, day)
}

export function parseDate(value: string, options: ParseDateOptions = {}) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const dateOrder = options.dateOrder ?? 'auto'

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    try {
      return parseDateInput(trimmed.slice(0, 10))
    } catch {
      return null
    }
  }

  const ymdSlash = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (ymdSlash) {
    if (dateOrder === 'ymd' || dateOrder === 'auto') {
      const parsed = parseYmdParts(
        Number(ymdSlash[1]),
        Number(ymdSlash[2]),
        Number(ymdSlash[3]),
      )
      if (parsed) return parsed
    }
    if (dateOrder === 'ymd') return null
  }

  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slash) {
    if (dateOrder === 'ymd') return null

    const first = Number(slash[1])
    const second = Number(slash[2])
    const year = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
    return parseSlashParts(first, second, year, dateOrder)
  }

  const serial = Number(trimmed)
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30 + serial))
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

export { toDateInput } from '#/lib/calendar-date'
