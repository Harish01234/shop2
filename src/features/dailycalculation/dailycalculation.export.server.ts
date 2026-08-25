import { PassThrough } from 'node:stream'

import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

import { prisma } from '#/db'
import type { DownloadableFile } from '#/lib/download-file'
import { formatCalendarDate, toDateInput } from '#/lib/calendar-date'
import type { MainCalculationRecord } from '#/features/maincalculation/maincalculation.types'

import { getDailyCalculationDetailRecord } from './dailycalculation.server'
import {
  EXPORT_COLORS,
  buildDailyLeftLines,
  buildDailyRightLines,
  buildMainLeftLines,
  buildMainRightLines,
  exportBannerTitle,
  formatExportMoney,
} from './dailycalculation.export-layout'
import type {
  DailyCalculationDetail,
  DailyCalculationExportFormat,
  DailyCalculationExportScope,
  ExportDailyCalculationInput,
} from './dailycalculation.types'
import { formatPeriodLabel } from './dailycalculation.utils'

type ExportPayload = {
  periodLabel: string
  detail: DailyCalculationDetail
  mainCalculation: MainCalculationRecord | null
}

function balanceLabel(status: 'CORRECT' | 'INCORRECT') {
  return status === 'CORRECT' ? 'Correct' : 'Incorrect'
}

function exportFilename(
  detail: DailyCalculationDetail,
  format: DailyCalculationExportFormat,
  scope: DailyCalculationExportScope,
) {
  const stamp = toDateInput(detail.periodStart) || 'export'
  const ext = format === 'pdf' ? 'pdf' : 'xlsx'
  return `daily-calculation-${stamp}-${scope}.${ext}`
}

async function loadExportPayload(id: string): Promise<ExportPayload | null> {
  const detail = await getDailyCalculationDetailRecord({ id })
  if (!detail) return null

  const mainCalculation = await prisma.mainCalculation.findUnique({
    where: { dailyCalculationId: id },
    include: {
      dailyCalculation: {
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          recordStatus: true,
        },
      },
    },
  })

  return {
    periodLabel: formatPeriodLabel(
      detail.periodStart,
      detail.periodEnd,
      detail.recordStatus,
    ),
    detail,
    mainCalculation: mainCalculation as MainCalculationRecord | null,
  }
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: EXPORT_COLORS.grid } },
  left: { style: 'thin', color: { argb: EXPORT_COLORS.grid } },
  bottom: { style: 'thin', color: { argb: EXPORT_COLORS.grid } },
  right: { style: 'thin', color: { argb: EXPORT_COLORS.grid } },
}

function applyFill(cell: ExcelJS.Cell, color: string) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  }
}

function styleLabelCell(cell: ExcelJS.Cell, bg: string, bold = false) {
  applyFill(cell, bg)
  cell.font = { bold, color: { argb: EXPORT_COLORS.black } }
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
  cell.border = thinBorder
}

function styleValueCell(
  cell: ExcelJS.Cell,
  bg: string,
  value: number | string,
  bold = false,
) {
  applyFill(cell, bg)
  cell.font = { bold, color: { argb: EXPORT_COLORS.black } }
  cell.border = thinBorder

  if (typeof value === 'number') {
    cell.value = value
    cell.numFmt = '#,##0'
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
  } else {
    cell.value = value
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
  }
}

function writeSummarySection(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  labelCol: number,
  valueCol: number,
  title: string,
  bgColor: string,
  lines: ReturnType<typeof buildDailyLeftLines>,
) {
  const titleCell = sheet.getCell(startRow, labelCol)
  sheet.mergeCells(startRow, labelCol, startRow, valueCol)
  titleCell.value = title
  titleCell.font = { bold: true, size: 11, color: { argb: EXPORT_COLORS.black } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  applyFill(titleCell, bgColor)
  titleCell.border = thinBorder
  sheet.getCell(startRow, valueCol).border = thinBorder

  let row = startRow + 1
  for (const line of lines) {
    styleLabelCell(sheet.getCell(row, labelCol), bgColor, line.bold)
    sheet.getCell(row, labelCol).value = line.label
    styleValueCell(sheet.getCell(row, valueCol), bgColor, line.value, line.bold)
    row += 1
  }

  return row - 1
}

function writeBalancePair(
  sheet: ExcelJS.Worksheet,
  row: number,
  differenceLabel: string,
  difference: number,
  statusLabel: string,
  status: string,
) {
  styleLabelCell(sheet.getCell(row, 1), 'FFF5F5F5', true)
  sheet.getCell(row, 1).value = differenceLabel
  styleValueCell(sheet.getCell(row, 2), 'FFF5F5F5', difference, true)
  styleLabelCell(sheet.getCell(row, 4), 'FFF5F5F5', true)
  sheet.getCell(row, 4).value = statusLabel
  styleValueCell(sheet.getCell(row, 5), 'FFF5F5F5', status, false)
}

function writeBalanceRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  detail: DailyCalculationDetail,
  main: MainCalculationRecord | null,
) {
  writeBalancePair(
    sheet,
    startRow,
    'Daily Calculation — Difference (Val1 − Val2)',
    detail.difference,
    'Daily Calculation — Balance Status',
    balanceLabel(detail.balanceStatus),
  )

  if (!main) return startRow

  writeBalancePair(
    sheet,
    startRow + 1,
    'Main Calculation — Difference',
    main.difference,
    'Main Calculation — Balance Status',
    balanceLabel(main.balanceStatus),
  )

  return startRow + 1
}

async function renderXlsx(
  payload: ExportPayload,
  scope: DailyCalculationExportScope,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Daily Hisab', {
    views: [{ showGridLines: false }],
  })

  sheet.getColumn(1).width = 22
  sheet.getColumn(2).width = 16
  sheet.getColumn(3).width = 2
  sheet.getColumn(4).width = 22
  sheet.getColumn(5).width = 16
  sheet.getColumn(6).width = 2
  sheet.getColumn(7).width = 14
  sheet.getColumn(8).width = 14
  sheet.getColumn(9).width = 14

  const dailyLeftEnd = writeSummarySection(
    sheet,
    1,
    1,
    2,
    'Daily Calculation — Left',
    EXPORT_COLORS.dailyLeft,
    buildDailyLeftLines(payload.detail),
  )
  const dailyRightEnd = writeSummarySection(
    sheet,
    1,
    4,
    5,
    'Daily Calculation — Right',
    EXPORT_COLORS.dailyRight,
    buildDailyRightLines(payload.detail),
  )

  const mainTopRow = Math.max(dailyLeftEnd, dailyRightEnd) + 2
  const mainLeftLines = buildMainLeftLines(payload.mainCalculation)
  const mainRightLines = buildMainRightLines(payload.mainCalculation)
  let mainSectionEnd = mainTopRow

  if (!payload.mainCalculation) {
    const noteCell = sheet.getCell(mainTopRow, 1)
    sheet.mergeCells(mainTopRow, 1, mainTopRow + 2, 5)
    noteCell.value = 'No Main Calculation yet'
    noteCell.font = { italic: true, color: { argb: EXPORT_COLORS.black } }
    noteCell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyFill(noteCell, EXPORT_COLORS.mainLeft)
    noteCell.border = thinBorder
    mainSectionEnd = mainTopRow + 2
  } else {
    const mainLeftEnd = writeSummarySection(
      sheet,
      mainTopRow,
      1,
      2,
      'Main Calculation — Left',
      EXPORT_COLORS.mainLeft,
      mainLeftLines,
    )
    const mainRightEnd = writeSummarySection(
      sheet,
      mainTopRow,
      4,
      5,
      'Main Calculation — Right',
      EXPORT_COLORS.mainRight,
      mainRightLines,
    )
    mainSectionEnd = Math.max(mainLeftEnd, mainRightEnd)
  }

  const balanceRow = mainSectionEnd + 2
  const lastBalanceRow = writeBalanceRows(
    sheet,
    balanceRow,
    payload.detail,
    payload.mainCalculation,
  )

  const bannerRow = lastBalanceRow + 2
  const bannerCell = sheet.getCell(bannerRow, 1)
  sheet.mergeCells(bannerRow, 1, bannerRow, 9)
  bannerCell.value = exportBannerTitle(payload.periodLabel)
  bannerCell.font = {
    bold: true,
    size: 14,
    color: { argb: EXPORT_COLORS.white },
  }
  bannerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  applyFill(bannerCell, EXPORT_COLORS.banner)
  bannerCell.border = thinBorder
  sheet.getRow(bannerRow).height = 28

  if (scope === 'full') {
    const tableStartRow = bannerRow + 2
    writeDeoyaTable(sheet, tableStartRow, 1, payload.detail)
    writeAsolSudhTable(sheet, tableStartRow, 7, payload.detail)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function styleTableHeader(cell: ExcelJS.Cell, bg: string, text: string) {
  cell.value = text
  cell.font = { bold: true, color: { argb: EXPORT_COLORS.black } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  applyFill(cell, bg)
  cell.border = thinBorder
}

function styleTableBodyCell(
  cell: ExcelJS.Cell,
  value: string | number,
  align: 'left' | 'right' | 'center',
) {
  cell.border = thinBorder
  cell.font = { color: { argb: EXPORT_COLORS.black } }
  cell.alignment = { horizontal: align, vertical: 'middle' }

  if (typeof value === 'number') {
    cell.value = value
    cell.numFmt = '#,##0'
  } else {
    cell.value = value
  }
}

function writeDeoyaTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  detail: DailyCalculationDetail,
) {
  const headers = ['SL No', 'Amount', 'Date']
  headers.forEach((header, index) => {
    styleTableHeader(
      sheet.getCell(startRow, startCol + index),
      EXPORT_COLORS.deoyaHeader,
      header,
    )
  })

  const titleCell = sheet.getCell(startRow - 1, startCol)
  sheet.mergeCells(startRow - 1, startCol, startRow - 1, startCol + 2)
  titleCell.value = 'Deoya'
  titleCell.font = { bold: true, size: 11 }
  titleCell.alignment = { horizontal: 'center' }

  let row = startRow + 1
  for (const entry of detail.deoyaRows) {
    styleTableBodyCell(sheet.getCell(row, startCol), entry.slNo, 'left')
    styleTableBodyCell(sheet.getCell(row, startCol + 1), entry.amount, 'right')
    styleTableBodyCell(
      sheet.getCell(row, startCol + 2),
      formatCalendarDate(entry.date),
      'left',
    )
    row += 1
  }

  if (detail.deoyaRows.length === 0) {
    const emptyCell = sheet.getCell(row, startCol)
    sheet.mergeCells(row, startCol, row, startCol + 2)
    emptyCell.value = 'No records in this period'
    emptyCell.font = { italic: true }
    emptyCell.alignment = { horizontal: 'center' }
    emptyCell.border = thinBorder
    row += 1
  }

  styleLabelCell(sheet.getCell(row, startCol), EXPORT_COLORS.deoyaHeader, true)
  sheet.getCell(row, startCol).value = 'Total Deoya'
  styleValueCell(
    sheet.getCell(row, startCol + 1),
    EXPORT_COLORS.deoyaHeader,
    detail.deoya,
    true,
  )
  styleTableBodyCell(sheet.getCell(row, startCol + 2), '', 'left')
}

function writeAsolSudhTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  detail: DailyCalculationDetail,
) {
  const headers = ['SL No', 'Amount', 'Sudh', 'Date']
  headers.forEach((header, index) => {
    styleTableHeader(
      sheet.getCell(startRow, startCol + index),
      EXPORT_COLORS.asolHeader,
      header,
    )
  })

  const titleCell = sheet.getCell(startRow - 1, startCol)
  sheet.mergeCells(startRow - 1, startCol, startRow - 1, startCol + 3)
  titleCell.value = 'Asol + Sudh'
  titleCell.font = { bold: true, size: 11 }
  titleCell.alignment = { horizontal: 'center' }

  let row = startRow + 1
  for (const entry of detail.asolSudhRows) {
    styleTableBodyCell(sheet.getCell(row, startCol), entry.slNo, 'left')
    styleTableBodyCell(sheet.getCell(row, startCol + 1), entry.amount, 'right')
    styleTableBodyCell(sheet.getCell(row, startCol + 2), entry.sudh, 'right')
    styleTableBodyCell(
      sheet.getCell(row, startCol + 3),
      formatCalendarDate(entry.date),
      'left',
    )
    row += 1
  }

  if (detail.asolSudhRows.length === 0) {
    const emptyCell = sheet.getCell(row, startCol)
    sheet.mergeCells(row, startCol, row, startCol + 3)
    emptyCell.value = 'No records in this period'
    emptyCell.font = { italic: true }
    emptyCell.alignment = { horizontal: 'center' }
    emptyCell.border = thinBorder
  }
}

type PdfRgb = `#${string}`

const PDF_COLORS = {
  dailyLeft: '#F4A896' as PdfRgb,
  dailyRight: '#B5E48C' as PdfRgb,
  mainLeft: '#FFB4D2' as PdfRgb,
  mainRight: '#CDB4DB' as PdfRgb,
  banner: '#2EC4B6' as PdfRgb,
  deoyaHeader: '#FFBF69' as PdfRgb,
  asolHeader: '#FFD166' as PdfRgb,
  grid: '#BBBBBB' as PdfRgb,
  white: '#FFFFFF' as PdfRgb,
}

function fillRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  hex: PdfRgb,
) {
  doc.fillColor(hex).rect(x, y, width, height).fill()
}

function renderPdfBlock(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  title: string,
  bg: PdfRgb,
  lines: ReturnType<typeof buildDailyLeftLines>,
) {
  const titleHeight = 20
  const rowHeight = 17
  const height = titleHeight + lines.length * rowHeight + 10

  fillRect(doc, x, y, width, height, bg)

  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(10)
  doc.text(title, x + 8, y + 5, { width: width - 16, align: 'center' })

  let cy = y + titleHeight
  for (const line of lines) {
    doc
      .font(line.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor('#111111')
    const valueText =
      typeof line.value === 'number'
        ? formatExportMoney(line.value)
        : String(line.value)
    doc.text(line.label, x + 10, cy, {
      width: width * 0.58,
      align: 'left',
      lineBreak: false,
    })
    doc.text(valueText, x + 10, cy, {
      width: width - 20,
      align: 'right',
      lineBreak: false,
    })
    cy += rowHeight
  }

  doc.strokeColor(PDF_COLORS.grid).lineWidth(0.75)
  doc.rect(x, y, width, height).stroke()

  return height
}

function renderPdfTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  title: string,
  headerBg: PdfRgb,
  headers: string[],
  rows: (string | number)[][],
  colWidths: number[],
  alignments: ('left' | 'right' | 'center')[],
  boldLastRow = false,
) {
  const rowHeight = 17
  const headerHeight = 20
  const titleHeight = 16

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111')
  doc.text(title, x, y, { width, align: 'center' })

  let cy = y + titleHeight
  fillRect(doc, x, cy, width, headerHeight, headerBg)

  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9)
  let hx = x
  headers.forEach((header, index) => {
    doc.text(header, hx + 4, cy + 5, {
      width: colWidths[index]! - 8,
      align: alignments[index],
      lineBreak: false,
    })
    hx += colWidths[index]!
  })

  cy += headerHeight
  doc.strokeColor(PDF_COLORS.grid).lineWidth(0.75)
  doc.rect(x, cy - headerHeight, width, headerHeight).stroke()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!
    const isTotalRow = boldLastRow && rowIndex === rows.length - 1
    hx = x

    doc
      .font(isTotalRow ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor('#111111')

    for (let index = 0; index < row.length; index += 1) {
      const cell = row[index]!
      const text =
        typeof cell === 'number' ? formatExportMoney(cell) : String(cell)
      doc.text(text, hx + 4, cy + 4, {
        width: colWidths[index]! - 8,
        align: alignments[index],
        lineBreak: false,
      })

      if (index > 0) {
        doc
          .moveTo(hx, cy)
          .lineTo(hx, cy + rowHeight)
          .strokeColor(PDF_COLORS.grid)
          .lineWidth(0.5)
          .stroke()
      }

      hx += colWidths[index]!
    }

    doc.rect(x, cy, width, rowHeight).stroke()
    cy += rowHeight
  }

  doc.rect(x, y + titleHeight, width, cy - y - titleHeight).stroke()

  return cy - y
}

function renderPdf(payload: ExportPayload, scope: DailyCalculationExportScope) {
  const landscape = scope === 'full'
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 36,
      size: 'A4',
      layout: landscape ? 'landscape' : 'portrait',
    })
    const stream = new PassThrough()
    const chunks: Buffer[] = []

    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)

    doc.pipe(stream)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const gap = 12
    const blockWidth = (pageWidth - gap) / 2
    const leftX = doc.page.margins.left
    const rightX = leftX + blockWidth + gap
    let y = doc.page.margins.top

    const dailyLeftH = renderPdfBlock(
      doc,
      leftX,
      y,
      blockWidth,
      'Daily Calculation — Left',
      PDF_COLORS.dailyLeft,
      buildDailyLeftLines(payload.detail),
    )
    const dailyRightH = renderPdfBlock(
      doc,
      rightX,
      y,
      blockWidth,
      'Daily Calculation — Right',
      PDF_COLORS.dailyRight,
      buildDailyRightLines(payload.detail),
    )

    y += Math.max(dailyLeftH, dailyRightH) + 14

    const mainLeftLines = buildMainLeftLines(payload.mainCalculation)
    const mainRightLines = buildMainRightLines(payload.mainCalculation)

    if (payload.mainCalculation) {
      const mainLeftH = renderPdfBlock(
        doc,
        leftX,
        y,
        blockWidth,
        'Main Calculation — Left',
        PDF_COLORS.mainLeft,
        mainLeftLines,
      )

      const mainRightH = renderPdfBlock(
        doc,
        rightX,
        y,
        blockWidth,
        'Main Calculation — Right',
        PDF_COLORS.mainRight,
        mainRightLines,
      )

      y += Math.max(mainLeftH, mainRightH) + 12
    } else {
      const blockHeight = 52
      fillRect(doc, leftX, y, pageWidth, blockHeight, PDF_COLORS.mainLeft)
      doc.fillColor('#111111').font('Helvetica-Oblique').fontSize(10)
      doc.text('No Main Calculation yet', leftX, y + blockHeight / 2 - 6, {
        width: pageWidth,
        align: 'center',
      })
      doc.strokeColor(PDF_COLORS.grid).lineWidth(0.75)
      doc.rect(leftX, y, pageWidth, blockHeight).stroke()
      y += blockHeight + 12
    }

    doc.font('Helvetica').fontSize(9).fillColor('#111111')
    doc.text(
      `Daily Calculation — Difference: ${formatExportMoney(payload.detail.difference)} · ${balanceLabel(payload.detail.balanceStatus)}`,
      leftX,
      y,
      { width: blockWidth, align: 'left' },
    )
    if (payload.mainCalculation) {
      doc.text(
        `Main Calculation — Difference: ${formatExportMoney(payload.mainCalculation.difference)} · ${balanceLabel(payload.mainCalculation.balanceStatus)}`,
        rightX,
        y,
        { width: blockWidth, align: 'left' },
      )
    }

    y += 22

    fillRect(doc, leftX, y, pageWidth, 28, PDF_COLORS.banner)
    doc.fillColor(PDF_COLORS.white).font('Helvetica-Bold').fontSize(13)
    doc.text(exportBannerTitle(payload.periodLabel), leftX, y + 8, {
      width: pageWidth,
      align: 'center',
    })

    y += 38

    if (scope === 'full') {
      const tableGap = 16
      const tableWidth = (pageWidth - tableGap) / 2
      const deoyaCols = [
        tableWidth * 0.28,
        tableWidth * 0.38,
        tableWidth * 0.34,
      ]
      const asolCols = [
        tableWidth * 0.2,
        tableWidth * 0.26,
        tableWidth * 0.26,
        tableWidth * 0.28,
      ]

      const deoyaRows =
        payload.detail.deoyaRows.length > 0
          ? payload.detail.deoyaRows.map((row) => [
              row.slNo,
              row.amount,
              formatCalendarDate(row.date),
            ])
          : [['—', '—', 'No records']]

      deoyaRows.push(['Total Deoya', payload.detail.deoya, ''])

      const asolRows =
        payload.detail.asolSudhRows.length > 0
          ? payload.detail.asolSudhRows.map((row) => [
              row.slNo,
              row.amount,
              row.sudh,
              formatCalendarDate(row.date),
            ])
          : [['—', '—', '—', 'No records']]

      const deoyaH = renderPdfTable(
        doc,
        leftX,
        y,
        tableWidth,
        'Deoya',
        PDF_COLORS.deoyaHeader,
        ['SL No', 'Amount', 'Date'],
        deoyaRows,
        deoyaCols,
        ['left', 'right', 'left'],
        true,
      )
      const asolH = renderPdfTable(
        doc,
        leftX + tableWidth + tableGap,
        y,
        tableWidth,
        'Asol + Sudh',
        PDF_COLORS.asolHeader,
        ['SL No', 'Amount', 'Sudh', 'Date'],
        asolRows,
        asolCols,
        ['left', 'right', 'right', 'left'],
      )

      y += Math.max(deoyaH, asolH)
    }

    doc.end()
  })
}

export async function exportDailyCalculationRecord(
  input: ExportDailyCalculationInput,
): Promise<DownloadableFile | null> {
  const payload = await loadExportPayload(input.id)
  if (!payload) return null

  const filename = exportFilename(payload.detail, input.format, input.scope)

  if (input.format === 'pdf') {
    const buffer = await renderPdf(payload, input.scope)
    return {
      filename,
      mimeType: 'application/pdf',
      content: buffer.toString('base64'),
      encoding: 'base64',
    }
  }

  const buffer = await renderXlsx(payload, input.scope)
  return {
    filename,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: buffer.toString('base64'),
    encoding: 'base64',
  }
}
