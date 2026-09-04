import ExcelJS from 'exceljs'
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'

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
  type ExportSummaryLine,
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
    'Daily Calculation - Difference (Val1 - Val2)',
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
  balanceBg: '#F5F5F5' as PdfRgb,
  grid: '#BBBBBB' as PdfRgb,
  white: '#FFFFFF' as PdfRgb,
  text: '#111111' as PdfRgb,
  correct: '#047857' as PdfRgb,
  incorrect: '#DC2626' as PdfRgb,
}

type PdfFonts = {
  regular: PDFFont
  bold: PDFFont
}

function hexToColor(hex: PdfRgb) {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

function topToPdfY(pageHeight: number, yFromTop: number) {
  return pageHeight - yFromTop
}

function drawFilledRect(
  page: PDFPage,
  pageHeight: number,
  x: number,
  yFromTop: number,
  width: number,
  height: number,
  fill: PdfRgb,
  stroke = true,
) {
  page.drawRectangle({
    x,
    y: topToPdfY(pageHeight, yFromTop + height),
    width,
    height,
    color: hexToColor(fill),
    borderColor: stroke ? hexToColor(PDF_COLORS.grid) : undefined,
    borderWidth: stroke ? 0.75 : 0,
  })
}

function textWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(text, size)
}

function sanitizePdfText(text: string) {
  return text
    .replace(/\u2212/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
}

function drawTextAt(
  page: PDFPage,
  pageHeight: number,
  text: string,
  x: number,
  yFromTop: number,
  width: number,
  size: number,
  font: PDFFont,
  align: 'left' | 'right' | 'center',
  color: PdfRgb = PDF_COLORS.text,
) {
  const safeText = sanitizePdfText(text)
  const tw = textWidth(font, safeText, size)
  let drawX = x
  if (align === 'center') drawX = x + (width - tw) / 2
  if (align === 'right') drawX = x + width - tw

  page.drawText(safeText, {
    x: drawX,
    y: topToPdfY(pageHeight, yFromTop + size),
    size,
    font,
    color: hexToColor(color),
  })
}

function balanceStatusColor(status: 'CORRECT' | 'INCORRECT') {
  return status === 'CORRECT' ? PDF_COLORS.correct : PDF_COLORS.incorrect
}

function drawPdfCell(
  page: PDFPage,
  pageHeight: number,
  x: number,
  yFromTop: number,
  width: number,
  height: number,
  fill: PdfRgb,
  text: string,
  font: PDFFont,
  size: number,
  align: 'left' | 'right' | 'center',
  textColor: PdfRgb = PDF_COLORS.text,
) {
  drawFilledRect(page, pageHeight, x, yFromTop, width, height, fill, true)
  if (text) {
    drawTextAt(
      page,
      pageHeight,
      text,
      x + 6,
      yFromTop + (height - size) / 2,
      width - 12,
      size,
      font,
      align,
      textColor,
    )
  }
}

const PDF_SUMMARY_TITLE_HEIGHT = 22
const PDF_SUMMARY_ROW_HEIGHT = 18

function renderPdfSummaryTable(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  x: number,
  yFromTop: number,
  width: number,
  title: string,
  bg: PdfRgb,
  lines: ReturnType<typeof buildDailyLeftLines>,
) {
  const titleHeight = PDF_SUMMARY_TITLE_HEIGHT
  const rowHeight = PDF_SUMMARY_ROW_HEIGHT
  const labelWidth = Math.round(width * 0.58)
  const valueWidth = width - labelWidth

  drawPdfCell(
    page,
    pageHeight,
    x,
    yFromTop,
    width,
    titleHeight,
    bg,
    title,
    fonts.bold,
    10,
    'center',
  )

  let rowTop = yFromTop + titleHeight
  for (const line of lines) {
    const font = line.bold ? fonts.bold : fonts.regular
    const valueText =
      typeof line.value === 'number'
        ? formatExportMoney(line.value)
        : String(line.value)

    drawPdfCell(
      page,
      pageHeight,
      x,
      rowTop,
      labelWidth,
      rowHeight,
      bg,
      line.label,
      font,
      9,
      'left',
    )
    drawPdfCell(
      page,
      pageHeight,
      x + labelWidth,
      rowTop,
      valueWidth,
      rowHeight,
      bg,
      valueText,
      font,
      9,
      'right',
    )
    rowTop += rowHeight
  }

  return titleHeight + lines.length * rowHeight
}

function renderPdfSummaryPadding(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  x: number,
  yFromTop: number,
  width: number,
  bg: PdfRgb,
  padRows: number,
) {
  if (padRows <= 0) return

  const rowHeight = PDF_SUMMARY_ROW_HEIGHT
  const labelWidth = Math.round(width * 0.58)
  const valueWidth = width - labelWidth

  for (let index = 0; index < padRows; index += 1) {
    const rowTop = yFromTop + index * rowHeight
    drawPdfCell(
      page,
      pageHeight,
      x,
      rowTop,
      labelWidth,
      rowHeight,
      bg,
      '',
      fonts.regular,
      9,
      'left',
    )
    drawPdfCell(
      page,
      pageHeight,
      x + labelWidth,
      rowTop,
      valueWidth,
      rowHeight,
      bg,
      '',
      fonts.regular,
      9,
      'right',
    )
  }
}

function renderPdfSummaryPair(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  leftX: number,
  rightX: number,
  blockWidth: number,
  yFromTop: number,
  leftTitle: string,
  rightTitle: string,
  leftBg: PdfRgb,
  rightBg: PdfRgb,
  leftLines: ExportSummaryLine[],
  rightLines: ExportSummaryLine[],
) {
  const leftBody = filterValLines(leftLines)
  const rightBody = filterValLines(rightLines)
  const maxBodyRows = Math.max(leftBody.length, rightBody.length)

  renderPdfSummaryTable(
    page,
    pageHeight,
    fonts,
    leftX,
    yFromTop,
    blockWidth,
    leftTitle,
    leftBg,
    leftBody,
  )
  renderPdfSummaryTable(
    page,
    pageHeight,
    fonts,
    rightX,
    yFromTop,
    blockWidth,
    rightTitle,
    rightBg,
    rightBody,
  )

  const bodyTop = yFromTop + PDF_SUMMARY_TITLE_HEIGHT
  renderPdfSummaryPadding(
    page,
    pageHeight,
    fonts,
    leftX,
    bodyTop + leftBody.length * PDF_SUMMARY_ROW_HEIGHT,
    blockWidth,
    leftBg,
    maxBodyRows - leftBody.length,
  )
  renderPdfSummaryPadding(
    page,
    pageHeight,
    fonts,
    rightX,
    bodyTop + rightBody.length * PDF_SUMMARY_ROW_HEIGHT,
    blockWidth,
    rightBg,
    maxBodyRows - rightBody.length,
  )

  const blockHeight =
    PDF_SUMMARY_TITLE_HEIGHT + maxBodyRows * PDF_SUMMARY_ROW_HEIGHT
  const valRowTop = yFromTop + blockHeight

  renderPdfPairedValRow(
    page,
    pageHeight,
    fonts,
    leftX,
    rightX,
    blockWidth,
    valRowTop,
    leftBg,
    rightBg,
    extractValLine(leftLines, 'Val1'),
    extractValLine(rightLines, 'Val2'),
  )

  return blockHeight + PDF_SUMMARY_ROW_HEIGHT
}

function renderPdfBalanceRows(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  x: number,
  yFromTop: number,
  width: number,
  detail: DailyCalculationDetail,
  main: MainCalculationRecord | null,
) {
  const rowHeight = 20
  const gap = 8
  const pairWidth = (width - gap) / 2
  const labelWidth = Math.round(pairWidth * 0.62)
  const valueWidth = pairWidth - labelWidth
  const bg = PDF_COLORS.balanceBg

  function drawBalanceRow(
    rowTop: number,
    differenceLabel: string,
    difference: number,
    statusLabel: string,
    status: 'CORRECT' | 'INCORRECT',
  ) {
    drawPdfCell(
      page,
      pageHeight,
      x,
      rowTop,
      labelWidth,
      rowHeight,
      bg,
      differenceLabel,
      fonts.bold,
      8,
      'left',
    )
    drawPdfCell(
      page,
      pageHeight,
      x + labelWidth,
      rowTop,
      valueWidth,
      rowHeight,
      bg,
      formatExportMoney(difference),
      fonts.bold,
      9,
      'right',
    )
    const statusX = x + pairWidth + gap
    drawPdfCell(
      page,
      pageHeight,
      statusX,
      rowTop,
      labelWidth,
      rowHeight,
      bg,
      statusLabel,
      fonts.bold,
      8,
      'left',
    )
    drawPdfCell(
      page,
      pageHeight,
      statusX + labelWidth,
      rowTop,
      valueWidth,
      rowHeight,
      bg,
      balanceLabel(status),
      fonts.bold,
      9,
      'left',
      balanceStatusColor(status),
    )
  }

  drawBalanceRow(
    yFromTop,
    'Daily Calculation - Difference (Val1 - Val2)',
    detail.difference,
    'Daily Calculation — Balance Status',
    detail.balanceStatus,
  )

  if (!main) {
    return rowHeight
  }

  drawBalanceRow(
    yFromTop + rowHeight,
    'Main Calculation — Difference',
    main.difference,
    'Main Calculation — Balance Status',
    main.balanceStatus,
  )

  return rowHeight * 2
}

function filterValLines(lines: ExportSummaryLine[]) {
  return lines.filter(
    (line) => line.label !== 'Val1' && line.label !== 'Val2',
  )
}

function extractValLine(lines: ExportSummaryLine[], label: 'Val1' | 'Val2') {
  const line = lines.find((entry) => entry.label === label)
  if (!line) {
    throw new Error(`Missing ${label} in export summary lines`)
  }
  return line
}

function formatExportLineValue(value: number | string) {
  return typeof value === 'number' ? formatExportMoney(value) : String(value)
}

function renderPdfPairedValRow(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  leftX: number,
  rightX: number,
  blockWidth: number,
  yFromTop: number,
  leftBg: PdfRgb,
  rightBg: PdfRgb,
  val1: ExportSummaryLine,
  val2: ExportSummaryLine,
) {
  const rowHeight = PDF_SUMMARY_ROW_HEIGHT
  const labelWidth = Math.round(blockWidth * 0.32)
  const valueWidth = blockWidth - labelWidth

  drawPdfCell(
    page,
    pageHeight,
    leftX,
    yFromTop,
    labelWidth,
    rowHeight,
    leftBg,
    val1.label,
    fonts.bold,
    9,
    'left',
  )
  drawPdfCell(
    page,
    pageHeight,
    leftX + labelWidth,
    yFromTop,
    valueWidth,
    rowHeight,
    leftBg,
    formatExportLineValue(val1.value),
    fonts.bold,
    9,
    'right',
  )
  drawPdfCell(
    page,
    pageHeight,
    rightX,
    yFromTop,
    labelWidth,
    rowHeight,
    rightBg,
    val2.label,
    fonts.bold,
    9,
    'left',
  )
  drawPdfCell(
    page,
    pageHeight,
    rightX + labelWidth,
    yFromTop,
    valueWidth,
    rowHeight,
    rightBg,
    formatExportLineValue(val2.value),
    fonts.bold,
    9,
    'right',
  )

  return rowHeight
}

type PdfRenderContext = {
  doc: PDFDocument
  fonts: PdfFonts
  pageWidth: number
  pageHeight: number
  margin: number
  currentPage: PDFPage
}

type PdfColumnCursor = {
  page: PDFPage
  y: number
}

function createPdfRenderContext(
  doc: PDFDocument,
  fonts: PdfFonts,
  landscape: boolean,
): PdfRenderContext {
  const pageWidth = landscape ? 841.89 : 595.28
  const pageHeight = landscape ? 595.28 : 841.89
  const currentPage = doc.addPage([pageWidth, pageHeight])

  return {
    doc,
    fonts,
    pageWidth,
    pageHeight,
    margin: 36,
    currentPage,
  }
}

function addPdfPage(ctx: PdfRenderContext) {
  ctx.currentPage = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight])
  return ctx.currentPage
}

function pdfBottomLimit(ctx: PdfRenderContext) {
  return ctx.pageHeight - ctx.margin
}

function drawPdfTableHeader(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  x: number,
  yFromTop: number,
  width: number,
  headerBg: PdfRgb,
  headers: string[],
  colWidths: number[],
  alignments: ('left' | 'right' | 'center')[],
  headerHeight: number,
) {
  drawFilledRect(page, pageHeight, x, yFromTop, width, headerHeight, headerBg)

  let columnX = x
  headers.forEach((header, index) => {
    drawTextAt(
      page,
      pageHeight,
      header,
      columnX + 4,
      yFromTop + 5,
      colWidths[index]! - 8,
      9,
      fonts.bold,
      alignments[index]!,
    )
    columnX += colWidths[index]!
  })
}

function drawPdfTableBodyRow(
  page: PDFPage,
  pageHeight: number,
  fonts: PdfFonts,
  x: number,
  yFromTop: number,
  width: number,
  row: (string | number)[],
  colWidths: number[],
  alignments: ('left' | 'right' | 'center')[],
  rowHeight: number,
  bold: boolean,
) {
  const font = bold ? fonts.bold : fonts.regular
  let columnX = x

  for (let index = 0; index < row.length; index += 1) {
    const cell = row[index]!
    const text =
      typeof cell === 'number' ? formatExportMoney(cell) : String(cell)
    drawTextAt(
      page,
      pageHeight,
      text,
      columnX + 4,
      yFromTop + 4,
      colWidths[index]! - 8,
      9,
      font,
      alignments[index]!,
    )

    if (index > 0) {
      page.drawLine({
        start: { x: columnX, y: topToPdfY(pageHeight, yFromTop + rowHeight) },
        end: { x: columnX, y: topToPdfY(pageHeight, yFromTop) },
        thickness: 0.5,
        color: hexToColor(PDF_COLORS.grid),
      })
    }

    columnX += colWidths[index]!
  }

  page.drawRectangle({
    x,
    y: topToPdfY(pageHeight, yFromTop + rowHeight),
    width,
    height: rowHeight,
    borderColor: hexToColor(PDF_COLORS.grid),
    borderWidth: 0.75,
  })
}

function renderPdfTablePaginated(
  ctx: PdfRenderContext,
  cursor: PdfColumnCursor,
  x: number,
  width: number,
  title: string,
  headerBg: PdfRgb,
  headers: string[],
  rows: (string | number)[][],
  colWidths: number[],
  alignments: ('left' | 'right' | 'center')[],
  options: { boldLastRow?: boolean } = {},
): PdfColumnCursor {
  const rowHeight = 17
  const headerHeight = 20
  const titleHeight = 16
  const bottomLimit = pdfBottomLimit(ctx)
  const boldLastRow = options.boldLastRow ?? false

  let rowIndex = 0
  let titleDrawn = false

  while (rowIndex < rows.length) {
    const needsTitle = !titleDrawn
    const segmentOverhead =
      (needsTitle ? titleHeight : 0) + headerHeight + rowHeight

    if (cursor.y + segmentOverhead > bottomLimit) {
      cursor.page = addPdfPage(ctx)
      cursor.y = ctx.margin
    }

    if (needsTitle) {
      drawTextAt(
        cursor.page,
        ctx.pageHeight,
        title,
        x,
        cursor.y,
        width,
        11,
        ctx.fonts.bold,
        'center',
      )
      cursor.y += titleHeight
      titleDrawn = true
    }

    drawPdfTableHeader(
      cursor.page,
      ctx.pageHeight,
      ctx.fonts,
      x,
      cursor.y,
      width,
      headerBg,
      headers,
      colWidths,
      alignments,
      headerHeight,
    )
    cursor.y += headerHeight

    while (rowIndex < rows.length) {
      if (cursor.y + rowHeight > bottomLimit) {
        cursor.page = addPdfPage(ctx)
        cursor.y = ctx.margin
        break
      }

      const isTotalRow = boldLastRow && rowIndex === rows.length - 1
      drawPdfTableBodyRow(
        cursor.page,
        ctx.pageHeight,
        ctx.fonts,
        x,
        cursor.y,
        width,
        rows[rowIndex]!,
        colWidths,
        alignments,
        rowHeight,
        isTotalRow,
      )
      cursor.y += rowHeight
      rowIndex += 1
    }
  }

  return cursor
}

async function renderPdf(
  payload: ExportPayload,
  scope: DailyCalculationExportScope,
): Promise<Buffer> {
  const landscape = scope === 'full'

  const pdfDoc = await PDFDocument.create()
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  }
  const ctx = createPdfRenderContext(pdfDoc, fonts, landscape)
  const page = ctx.currentPage
  const pageHeight = ctx.pageHeight

  const contentWidth = ctx.pageWidth - ctx.margin * 2
  const gap = 12
  const blockWidth = (contentWidth - gap) / 2
  const leftX = ctx.margin
  const rightX = leftX + blockWidth + gap
  let y = ctx.margin

  const dailyLeftLines = buildDailyLeftLines(payload.detail)
  const dailyRightLines = buildDailyRightLines(payload.detail)

  y += renderPdfSummaryPair(
    page,
    pageHeight,
    fonts,
    leftX,
    rightX,
    blockWidth,
    y,
    'Daily Calculation — Left',
    'Daily Calculation — Right',
    PDF_COLORS.dailyLeft,
    PDF_COLORS.dailyRight,
    dailyLeftLines,
    dailyRightLines,
  )
  y += 14

  const mainLeftLines = buildMainLeftLines(payload.mainCalculation)
  const mainRightLines = buildMainRightLines(payload.mainCalculation)

  if (payload.mainCalculation) {
    y += renderPdfSummaryPair(
      page,
      pageHeight,
      fonts,
      leftX,
      rightX,
      blockWidth,
      y,
      'Main Calculation — Left',
      'Main Calculation — Right',
      PDF_COLORS.mainLeft,
      PDF_COLORS.mainRight,
      mainLeftLines,
      mainRightLines,
    )
    y += 12
  } else {
    const blockHeight = 52
    drawFilledRect(
      page,
      pageHeight,
      leftX,
      y,
      contentWidth,
      blockHeight,
      PDF_COLORS.mainLeft,
    )
    drawTextAt(
      page,
      pageHeight,
      'No Main Calculation yet',
      leftX,
      y + blockHeight / 2 - 5,
      contentWidth,
      10,
      fonts.regular,
      'center',
    )
    y += blockHeight + 12
  }

  const balanceHeight = renderPdfBalanceRows(
    page,
    pageHeight,
    fonts,
    leftX,
    y,
    contentWidth,
    payload.detail,
    payload.mainCalculation,
  )

  y += balanceHeight + 14

  drawFilledRect(page, pageHeight, leftX, y, contentWidth, 28, PDF_COLORS.banner, false)
  drawTextAt(
    page,
    pageHeight,
    exportBannerTitle(payload.periodLabel),
    leftX,
    y + 8,
    contentWidth,
    13,
    fonts.bold,
    'center',
    PDF_COLORS.white,
  )

  y += 38

  if (scope === 'full') {
    const tableGap = 16
    const tableWidth = (contentWidth - tableGap) / 2
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

    const tableStartY = y
    const deoyaCursor: PdfColumnCursor = { page: ctx.currentPage, y: tableStartY }
    const asolCursor: PdfColumnCursor = { page: ctx.currentPage, y: tableStartY }

    renderPdfTablePaginated(
      ctx,
      deoyaCursor,
      leftX,
      tableWidth,
      'Deoya',
      PDF_COLORS.deoyaHeader,
      ['SL No', 'Amount', 'Date'],
      deoyaRows,
      deoyaCols,
      ['left', 'right', 'left'],
      { boldLastRow: true },
    )
    renderPdfTablePaginated(
      ctx,
      asolCursor,
      leftX + tableWidth + tableGap,
      tableWidth,
      'Asol + Sudh',
      PDF_COLORS.asolHeader,
      ['SL No', 'Amount', 'Sudh', 'Date'],
      asolRows,
      asolCols,
      ['left', 'right', 'right', 'left'],
    )
  }

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
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
