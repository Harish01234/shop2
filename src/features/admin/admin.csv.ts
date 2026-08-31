import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'

import {
  headerIndex,
  normalizeHeader,
  parseCredit,
  parseCsvTable,
  parseDate,
  parsePercentage,
  toDateInput,
} from './admin-csv-core'
import type { CsvParseOptions } from './admin-migration-date-format'

export type { CsvParseOptions } from './admin-migration-date-format'

export type CsvJinisPreviewRow = {
  rowNumber: number
  slNo: number | null
  name: string
  fatherName: string
  date: string
  credit: number | null
  phoneNo: string
  error: string | null
}

export type CsvJinisCharaPreviewRow = {
  rowNumber: number
  slNo: number | null
  name: string
  fatherName: string
  phoneNo: string
  credit: number | null
  percentage: number | null
  description: string | null
  date: string | null
  error: string | null
}

const unknownDate = '1970-01-01'

export function parseJinisCsv(text: string, options: CsvParseOptions = {}) {
  const table = parseCsvTable(text)
  const headerRowIndex = table.findIndex((row) => {
    const headers = row.map(normalizeHeader)
    return (
      headerIndex(headers, ['sl no', 'slno', 's no', 'serial no', 'serial']) >= 0 &&
      headerIndex(headers, ['credit']) >= 0
    )
  })

  if (headerRowIndex < 0) {
    throw new Error(
      'Could not find the header row. Use columns: Sl no and credit.',
    )
  }

  const headers = table[headerRowIndex].map(normalizeHeader)
  const slNoIndex = headerIndex(headers, ['sl no', 'slno', 's no', 'serial no', 'serial'])
  const nameIndex = headerIndex(headers, ['name'])
  const fatherIndex = headerIndex(headers, [
    'fathers name',
    'father name',
    'father',
    'fathername',
  ])
  const dateIndex = headerIndex(headers, ['date'])
  const creditIndex = headerIndex(headers, ['credit'])
  const phoneIndex = headerIndex(headers, ['phone no', 'phone', 'phoneno', 'mobile'])

  if (slNoIndex < 0 || creditIndex < 0) {
    throw new Error('CSV must include Sl no and credit.')
  }

  return table.slice(headerRowIndex + 1).flatMap((row, offset) => {
    const rowNumber = headerRowIndex + offset + 2
    const slNoRaw = row[slNoIndex] ?? ''
    const name = (nameIndex >= 0 ? row[nameIndex] : '')?.trim() || '-'
    const fatherName =
      (fatherIndex >= 0 ? row[fatherIndex] : '')?.trim() || '-'
    const dateRaw = dateIndex >= 0 ? (row[dateIndex] ?? '') : ''
    const creditRaw = row[creditIndex] ?? ''
    const phoneNo = (phoneIndex >= 0 ? row[phoneIndex] : '')?.trim() || '-'

    if (!slNoRaw && !creditRaw) {
      return []
    }

    const slNo = Number(slNoRaw.replace(/[^\d]/g, ''))
    const date = parseDate(dateRaw, options)
    const credit = parseCredit(creditRaw)
    const errors: string[] = []

    if (!Number.isInteger(slNo) || slNo <= 0) errors.push('Serial no is missing')
    if (!credit) errors.push('Credit is invalid')

    return [
      {
        rowNumber,
        slNo: Number.isInteger(slNo) && slNo > 0 ? slNo : null,
        name,
        fatherName,
        date: date ? toDateInput(date) : unknownDate,
        credit,
        phoneNo,
        error: errors.length ? errors.join('. ') : null,
      },
    ]
  })
}

export function parseJinisCharaCsv(text: string, options: CsvParseOptions = {}) {
  const table = parseCsvTable(text)
  const headerRowIndex = table.findIndex((row) => {
    const headers = row.map(normalizeHeader)
    return (
      headerIndex(headers, ['sl no', 'slno', 's no', 'serial no', 'serial']) >= 0 &&
      headerIndex(headers, ['credit']) >= 0 &&
      headerIndex(headers, ['name']) >= 0 &&
      headerIndex(headers, ['date']) >= 0
    )
  })

  if (headerRowIndex < 0) {
    throw new Error(
      'Could not find the header row. Use columns: slNo, name, credit, and date.',
    )
  }

  const headers = table[headerRowIndex].map(normalizeHeader)
  const slNoIndex = headerIndex(headers, ['sl no', 'slno', 's no', 'serial no', 'serial'])
  const nameIndex = headerIndex(headers, ['name'])
  const fatherIndex = headerIndex(headers, [
    'fathers name',
    'father name',
    'father',
    'fathername',
  ])
  const phoneIndex = headerIndex(headers, ['phone no', 'phone', 'phoneno', 'mobile'])
  const creditIndex = headerIndex(headers, ['credit'])
  const percentageIndex = headerIndex(headers, ['percentage', 'percent', 'pct'])
  const descriptionIndex = headerIndex(headers, ['description', 'desc', 'remarks'])
  const dateIndex = headerIndex(headers, ['date'])

  if (slNoIndex < 0 || creditIndex < 0 || nameIndex < 0 || dateIndex < 0) {
    throw new Error('CSV must include slNo, name, credit, and date.')
  }

  return table.slice(headerRowIndex + 1).flatMap((row, offset) => {
    const rowNumber = headerRowIndex + offset + 2
    const slNoRaw = row[slNoIndex] ?? ''
    const nameRaw = (row[nameIndex] ?? '').trim()
    const fatherName = (fatherIndex >= 0 ? row[fatherIndex] : '')?.trim() || '-'
    const phoneNo = (phoneIndex >= 0 ? row[phoneIndex] : '')?.trim() || '-'
    const creditRaw = row[creditIndex] ?? ''
    const percentageRaw = percentageIndex >= 0 ? (row[percentageIndex] ?? '') : ''
    const descriptionRaw =
      descriptionIndex >= 0 ? (row[descriptionIndex] ?? '').trim() : ''
    const dateRaw = row[dateIndex] ?? ''

    if (!slNoRaw && !creditRaw && !nameRaw) {
      return []
    }

    const slNo = Number(slNoRaw.replace(/[^\d]/g, ''))
    const credit = parseCredit(creditRaw)
    const issueDate = parseDate(dateRaw, options)
    const percentage = parsePercentage(percentageRaw)
    const errors: string[] = []

    if (!Number.isInteger(slNo) || slNo <= 0) errors.push('Serial no is missing')
    if (!nameRaw) errors.push('Name is missing')
    if (!credit) errors.push('Credit is invalid')
    if (!issueDate) errors.push('Date is invalid or missing')
    if (percentage.invalid) errors.push('Percentage is invalid')

    return [
      {
        rowNumber,
        slNo: Number.isInteger(slNo) && slNo > 0 ? slNo : null,
        name: nameRaw,
        fatherName,
        phoneNo,
        credit,
        percentage: percentage.invalid
          ? null
          : (percentage.value ?? DEFAULT_JINISCHARA_PERCENTAGE),
        description: descriptionRaw || null,
        date: issueDate ? toDateInput(issueDate) : null,
        error: errors.length ? errors.join('. ') : null,
      },
    ]
  })
}
