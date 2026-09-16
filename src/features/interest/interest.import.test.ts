import assert from 'node:assert/strict'
import test from 'node:test'

import { formatCalendarDate, toDateInput } from '../../lib/calendar-date.ts'

import {
  INVALID_EXCEL_DATE_SWAP,
  correctSwappedExcelDate,
  parseInterestImportDate,
  parseInterestImportRows,
  swapExcelDateDayAndMonth,
} from './interest.import.ts'

test('03/09/2026 is 3 September, not 9 March', () => {
  const date = parseInterestImportDate('03/09/2026')
  assert.equal(toDateInput(date), '2026-09-03')
  const label = formatCalendarDate(date)
  assert.match(label, /Sep/)
  assert.equal(label.includes('Mar'), false)
})

test('slash dates are always day-first, including 09/03/2026', () => {
  assert.equal(toDateInput(parseInterestImportDate('09/03/2026')), '2026-03-09')
  assert.match(formatCalendarDate(parseInterestImportDate('09/03/2026')), /Mar/)
  assert.equal(toDateInput(parseInterestImportDate('25/08/2026')), '2026-08-25')
  assert.equal(toDateInput(parseInterestImportDate('13/09/2026')), '2026-09-13')
  assert.equal(toDateInput(parseInterestImportDate('3/9/26')), '2026-09-03')
  assert.equal(toDateInput(parseInterestImportDate('03-09-2026')), '2026-09-03')
})

test('ISO dates that are already corrected are not swapped again', () => {
  assert.equal(toDateInput(parseInterestImportDate('2026-09-03')), '2026-09-03')
  assert.match(formatCalendarDate('2026-09-03'), /Sep/)
})

test('Excel date objects with swapped month/day become September dates', () => {
  assert.equal(swapExcelDateDayAndMonth('2026-03-09'), '2026-09-03')
  assert.equal(swapExcelDateDayAndMonth('2026-04-09'), '2026-09-04')
  assert.equal(swapExcelDateDayAndMonth('2026-05-09'), '2026-09-05')
  assert.equal(swapExcelDateDayAndMonth('2026-07-09'), '2026-09-07')
  assert.match(formatCalendarDate(swapExcelDateDayAndMonth('2026-03-09')), /Sep/)

  const marchNinth = new Date(Date.UTC(2026, 2, 9))
  assert.equal(correctSwappedExcelDate(marchNinth), '2026-09-03')
  assert.match(formatCalendarDate(correctSwappedExcelDate(marchNinth)), /Sep/)
})

test('invalid day/month swap is rejected instead of imported', () => {
  assert.equal(swapExcelDateDayAndMonth('2026-09-25'), null)
  assert.equal(swapExcelDateDayAndMonth('2026-09-13'), null)
  assert.equal(
    correctSwappedExcelDate(new Date(Date.UTC(2026, 8, 25))),
    INVALID_EXCEL_DATE_SWAP,
  )

  const rows = parseInterestImportRows([
    ['SL NO', 'AMOUNT', 'SUDH', 'DATE'],
    ['SAMIM', '', '400', INVALID_EXCEL_DATE_SWAP],
  ])
  assert.equal(rows[0]?.date, null)
  assert.match(rows[0]?.error ?? '', /correcting day\/month/)
})

test('text DD/MM/YYYY is not swapped a second time', () => {
  assert.equal(toDateInput(parseInterestImportDate('03/09/2026')), '2026-09-03')
  const rows = parseInterestImportRows([
    ['SL NO', 'AMOUNT', 'SUDH', 'DATE'],
    ['7924', '5800', '350', '03/09/2026'],
  ])
  assert.equal(rows[0]?.date, '2026-09-03')
  assert.match(formatCalendarDate(rows[0]?.date), /Sep/)
})

test('import preview rows show 3 September for 03/09/2026', () => {
  const rows = parseInterestImportRows([
    ['SL NO', 'AMOUNT', 'DATE', '', 'SL NO', 'AMOUNT', 'SUDH', 'DATE'],
    ['101', '5000', '12/09/2026', '', '7924', '5800', '350', '03/09/2026'],
    ['102', '1000', '01/02/2026', '', 'SAMIM', '', '400', '09/03/2026'],
  ])

  assert.equal(rows[0]?.date, '2026-09-03')
  assert.match(formatCalendarDate(rows[0]?.date), /Sep/)
  assert.equal(rows[1]?.date, '2026-03-09')
  assert.match(formatCalendarDate(rows[1]?.date), /Mar/)
})
