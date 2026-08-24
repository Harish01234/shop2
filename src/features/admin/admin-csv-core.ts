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

import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'

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

export function parseDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const date = new Date(`${trimmed.slice(0, 10)}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slash) {
    const first = Number(slash[1])
    const second = Number(slash[2])
    const year = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
    const dayFirst = first > 12 || second <= 12
    const day = dayFirst ? first : second
    const month = dayFirst ? second : first
    const date = new Date(year, month - 1, day)
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }
    return date
  }

  const serial = Number(trimmed)
  if (Number.isInteger(serial) && serial > 20000 && serial < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30 + serial))
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

export function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
