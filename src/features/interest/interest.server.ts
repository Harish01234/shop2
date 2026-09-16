import { prisma } from '#/db'
import type { InterestWhereInput } from '#/generated/prisma/models/Interest'
import { refreshDailyCalculationsForDates } from '#/features/dailycalculation/dailycalculation.server'
import { canonicalizeCalendarDate, dayEnd, dayStart } from '#/lib/calendar-date'
import { paginationArgs } from '#/lib/pagination'
import ExcelJS from 'exceljs'

import {
  correctSwappedExcelDate,
  findInterestImportHeader,
  parseDelimitedTable,
  parseInterestImportRows,
} from './interest.import'
import type {
  CreateInterestInput,
  DeleteAllInterestInput,
  InterestIdInput,
  InterestImportInput,
  InterestImportPreviewInput,
  InterestImportPreviewRow,
  ListInterestInput,
  UpdateInterestInput,
} from './interest.types'

const relatedSelect = {
  jinis: {
    select: {
      id: true,
      slNo: true,
      name: true,
    },
  },
  jinisChara: {
    select: {
      id: true,
      slNo: true,
      name: true,
    },
  },
} as const

const SETTLED_LINK_ERROR =
  'This record is already settled and cannot receive further interest.'

type InterestLinkClient = Pick<typeof prisma, 'jinis' | 'jinisChara'>

async function assertInterestTargetsExist(
  data: {
    jinisId?: string | null
    jinisCharaId?: string | null
  },
  db: InterestLinkClient = prisma,
) {
  if (data.jinisId) {
    const jinis = await db.jinis.findUnique({
      where: { id: data.jinisId },
      select: { id: true },
    })
    if (!jinis) {
      throw new Error('Jinis was not found.')
    }
  }

  if (data.jinisCharaId) {
    const jinisChara = await db.jinisChara.findUnique({
      where: { id: data.jinisCharaId },
      select: { id: true },
    })
    if (!jinisChara) {
      throw new Error('JinisChara was not found.')
    }
  }
}

/** New Interest may only be linked to open (unsettled) Jinis / JinisChara. */
async function assertOpenLinkForNewInterest(
  data: {
    jinisId?: string | null
    jinisCharaId?: string | null
  },
  db: InterestLinkClient = prisma,
) {
  if (data.jinisId) {
    const jinis = await db.jinis.findUnique({
      where: { id: data.jinisId },
      select: { id: true, active: true },
    })
    if (!jinis) {
      throw new Error('Jinis was not found.')
    }
    if (!jinis.active) {
      throw new Error(SETTLED_LINK_ERROR)
    }
  }

  if (data.jinisCharaId) {
    const jinisChara = await db.jinisChara.findUnique({
      where: { id: data.jinisCharaId },
      select: { id: true, active: true },
    })
    if (!jinisChara) {
      throw new Error('JinisChara was not found.')
    }
    if (!jinisChara.active) {
      throw new Error(SETTLED_LINK_ERROR)
    }
  }
}

async function assertInterestTargets(data: {
  jinisId?: string | null
  jinisCharaId?: string | null
}) {
  await assertInterestTargetsExist(data)
}

export async function listInterestRecords(data: ListInterestInput) {
  const where = buildInterestWhereInput(data)
  const { page, pageSize, skip, take } = paginationArgs(data.page, data.pageSize)

  const [records, total] = await Promise.all([
    prisma.interest.findMany({
      where,
      select: {
        id: true,
        amount: true,
        date: true,
        remarks: true,
        jinisId: true,
        jinisCharaId: true,
        personName: true,
        ...relatedSelect,
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.interest.count({ where }),
  ])

  return { records, total, page, pageSize }
}

function buildInterestWhereInput(
  data: Pick<
    ListInterestInput,
    | 'source'
    | 'jinisId'
    | 'jinisCharaId'
    | 'personName'
    | 'amountMin'
    | 'amountMax'
    | 'date'
    | 'from'
    | 'to'
  >,
) {
  const filters: InterestWhereInput[] = []

  if (data.source === 'jinis') {
    filters.push({ jinisId: { not: null } })
  }

  if (data.source === 'jinischara') {
    filters.push({ jinisCharaId: { not: null } })
  }

  if (data.source === 'person') {
    filters.push({ personName: { not: null } })
  }

  if (data.jinisId) {
    filters.push({ jinisId: data.jinisId })
  }

  if (data.jinisCharaId) {
    filters.push({ jinisCharaId: data.jinisCharaId })
  }

  if (data.personName) {
    filters.push({
      personName: { contains: data.personName, mode: 'insensitive' },
    })
  }

  if (data.amountMin !== undefined || data.amountMax !== undefined) {
    filters.push({
      amount: {
        ...(data.amountMin !== undefined ? { gte: data.amountMin } : {}),
        ...(data.amountMax !== undefined ? { lte: data.amountMax } : {}),
      },
    })
  }

  if (data.date) {
    filters.push({
      date: {
        gte: dayStart(data.date),
        lte: dayEnd(data.date),
      },
    })
  }

  if (data.from || data.to) {
    filters.push({
      date: {
        ...(data.from ? { gte: dayStart(data.from) } : {}),
        ...(data.to ? { lte: dayEnd(data.to) } : {}),
      },
    })
  }

  return filters.length ? { AND: filters } : undefined
}

export async function getInterestRecord(data: InterestIdInput) {
  return prisma.interest.findUnique({
    where: { id: data.id },
    include: relatedSelect,
  })
}

type InterestWriteClient = Pick<typeof prisma, 'jinis' | 'jinisChara' | 'interest'>

type NewInterestWriteInput = {
  amount: number
  date: Date
  remarks?: string | null
  jinisId?: string | null
  jinisCharaId?: string | null
  personName?: string | null
  settle?: boolean
}

async function writeNewInterestRecord(
  db: InterestWriteClient,
  data: NewInterestWriteInput,
  createdById: string,
) {
  const settle = Boolean(data.settle)
  const date = canonicalizeCalendarDate(data.date)
  await assertOpenLinkForNewInterest(data, db)

  const created = await db.interest.create({
    data: {
      amount: data.amount,
      date,
      remarks: data.remarks || null,
      jinisId: data.jinisId,
      jinisCharaId: data.jinisCharaId,
      personName: data.personName || null,
      createdById,
    },
  })

  let settledAt: Date | null = null
  if (settle) {
    settledAt = canonicalizeCalendarDate(new Date())

    if (data.jinisId) {
      await db.jinis.update({
        where: { id: data.jinisId },
        data: {
          active: false,
          settledAt,
        },
      })
    }

    if (data.jinisCharaId) {
      await db.jinisChara.update({
        where: { id: data.jinisCharaId },
        data: {
          active: false,
          settledAt,
        },
      })
    }
  }

  const record = await db.interest.findUniqueOrThrow({
    where: { id: created.id },
    include: relatedSelect,
  })

  return { created: record, settledAt }
}

export async function createInterestRecord(
  data: CreateInterestInput,
  createdById: string,
) {
  if (!data.settle) {
    const { created } = await writeNewInterestRecord(prisma, data, createdById)
    await refreshDailyCalculationsForDates([created.date])
    return created
  }

  const interest = await prisma.$transaction(async (tx) =>
    writeNewInterestRecord(tx, data, createdById),
  )

  await refreshDailyCalculationsForDates([
    interest.created.date,
    interest.settledAt,
  ])
  return interest.created
}

export async function updateInterestRecord(data: UpdateInterestInput) {
  const existing = await prisma.interest.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  await assertInterestTargets(data)

  const { id, ...fields } = data
  const date =
    fields.date === undefined
      ? undefined
      : canonicalizeCalendarDate(fields.date)

  const record = await prisma.interest.update({
    where: { id },
    data: {
      ...fields,
      ...(date ? { date } : {}),
      ...(fields.remarks !== undefined
        ? { remarks: fields.remarks || null }
        : {}),
      ...(fields.personName !== undefined
        ? { personName: fields.personName || null }
        : {}),
    },
    include: relatedSelect,
  })

  await refreshDailyCalculationsForDates([existing.date, record.date])
  return record
}

export async function deleteInterestRecord(data: InterestIdInput) {
  const existing = await prisma.interest.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  await prisma.interest.delete({
    where: { id: data.id },
  })

  await refreshDailyCalculationsForDates([existing.date])
  return { id: data.id }
}

export async function deleteAllInterestRecords(data: DeleteAllInterestInput) {
  const where = buildInterestWhereInput(data)

  const matching = await prisma.interest.findMany({
    where,
    select: { date: true },
  })

  if (matching.length === 0) {
    return { deleted: 0 }
  }

  await prisma.interest.deleteMany({ where })

  await refreshDailyCalculationsForDates(matching.map((record) => record.date))

  return { deleted: matching.length }
}

export async function sumInterestAmount() {
  const result = await prisma.interest.aggregate({
    _sum: { amount: true },
  })

  return result._sum.amount ?? 0
}

function looksLikeExcelDateFormat(numFmt: string | undefined) {
  if (!numFmt) return false
  const fmt = numFmt.toLowerCase()
  return fmt.includes('yy') || fmt.includes('dd/mm') || fmt.includes('mm/dd')
}

function excelSerialToDate(serial: number) {
  const date = new Date(Date.UTC(1899, 11, 30 + serial))
  return Number.isNaN(date.getTime()) ? null : date
}

function cellToText(cell: ExcelJS.Cell): string {
  return cellValueToText(cell.value, cell.numFmt, cell.type)
}

function cellValueToText(
  value: ExcelJS.CellValue,
  numFmt?: string,
  cellType?: ExcelJS.ValueType,
): string {
  if (value == null || value === '') return ''
  if (value instanceof Date) return correctSwappedExcelDate(value)
  if (
    typeof value === 'number' &&
    (looksLikeExcelDateFormat(numFmt) || cellType === ExcelJS.ValueType.Date)
  ) {
    const date = excelSerialToDate(value)
    return date ? correctSwappedExcelDate(date) : ''
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim()
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text.trim()
    }
    if ('result' in value) {
      return cellValueToText(
        value.result as ExcelJS.CellValue,
        numFmt,
        cellType,
      )
    }
  }
  return String(value).trim()
}

function worksheetToTable(sheet: ExcelJS.Worksheet) {
  const lastRow = sheet.lastRow?.number ?? 0
  const lastCol = sheet.lastColumn?.number ?? 0
  const table: string[][] = []

  for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const cells: string[] = []
    for (let colNumber = 1; colNumber <= lastCol; colNumber += 1) {
      cells.push(cellToText(row.getCell(colNumber)))
    }
    table.push(cells)
  }

  return table
}

async function fileToTable(input: InterestImportPreviewInput) {
  const fileName = input.fileName.toLowerCase()

  if (fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
    throw new Error('Please save this file as .xlsx or CSV and try again.')
  }

  if (fileName.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(
      Buffer.from(input.content, 'base64') as unknown as ArrayBuffer,
    )

    for (const sheet of workbook.worksheets) {
      const table = worksheetToTable(sheet)
      try {
        findInterestImportHeader(table)
        return table
      } catch {
        continue
      }
    }

    throw new Error(
      "Couldn't find a 'SL NO / AMOUNT / SUDH / DATE' header in this file — please check the format.",
    )
  }

  const text =
    input.encoding === 'base64'
      ? Buffer.from(input.content, 'base64').toString('utf8')
      : input.content
  return parseDelimitedTable(text)
}

function formatSheetNumber(value: number) {
  return value.toLocaleString('en-IN')
}

export async function previewInterestImport(input: InterestImportPreviewInput) {
  const table = await fileToTable(input)
  const parsed = parseInterestImportRows(table)
  const jinisSlNos = [
    ...new Set(
      parsed
        .map((row) => row.slNo)
        .filter((slNo): slNo is number => slNo != null),
    ),
  ]

  const jinisRecords =
    jinisSlNos.length === 0
      ? []
      : await prisma.jinis.findMany({
          where: { slNo: { in: jinisSlNos } },
          select: {
            id: true,
            slNo: true,
            credit: true,
            active: true,
          },
        })

  const jinisBySlNo = new Map<number, typeof jinisRecords>()
  for (const record of jinisRecords) {
    const list = jinisBySlNo.get(record.slNo) ?? []
    list.push(record)
    jinisBySlNo.set(record.slNo, list)
  }

  const seenSlNos = new Set<number>()
  const rows: InterestImportPreviewRow[] = parsed.map((row) => {
    if (row.error) {
      return {
        rowNumber: row.rowNumber,
        slNo: row.slNo,
        personName: row.personName,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: row.error,
      }
    }

    if (row.personName) {
      return {
        rowNumber: row.rowNumber,
        slNo: null,
        personName: row.personName,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'ok',
        message: null,
      }
    }

    const slNo = row.slNo
    if (slNo == null) {
      return {
        rowNumber: row.rowNumber,
        slNo: null,
        personName: null,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: 'SL No is missing',
      }
    }

    if (seenSlNos.has(slNo)) {
      return {
        rowNumber: row.rowNumber,
        slNo,
        personName: null,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: `SL No ${slNo} appears more than once in this file`,
      }
    }
    seenSlNos.add(slNo)

    const matches = jinisBySlNo.get(slNo) ?? []
    if (matches.length === 0) {
      return {
        rowNumber: row.rowNumber,
        slNo,
        personName: null,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: `SL No ${slNo} not found`,
      }
    }

    if (matches.length > 1) {
      return {
        rowNumber: row.rowNumber,
        slNo,
        personName: null,
        sheetAmount: row.sheetAmount,
        jinisCredit: null,
        jinisId: null,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: `SL No ${slNo} matches more than one Jinis`,
      }
    }

    const jinis = matches[0]
    if (!jinis.active) {
      return {
        rowNumber: row.rowNumber,
        slNo,
        personName: null,
        sheetAmount: row.sheetAmount,
        jinisCredit: jinis.credit,
        jinisId: jinis.id,
        sudh: row.sudh,
        date: row.date,
        settle: false,
        status: 'error',
        message: `SL No ${slNo} is already settled`,
      }
    }

    const amountMismatch =
      row.sheetAmount != null && row.sheetAmount !== jinis.credit

    return {
      rowNumber: row.rowNumber,
      slNo,
      personName: null,
      sheetAmount: row.sheetAmount,
      jinisCredit: jinis.credit,
      jinisId: jinis.id,
      sudh: row.sudh,
      date: row.date,
      settle: true,
      status: amountMismatch ? 'warning' : 'ok',
      message: amountMismatch
        ? `SL No ${slNo}: sheet shows ${formatSheetNumber(row.sheetAmount ?? 0)} but Jinis credit is ${formatSheetNumber(jinis.credit)}`
        : null,
    }
  })

  return { rows }
}

export async function importInterestRecords(
  data: InterestImportInput,
  createdById: string,
) {
  const jinisIds = [
    ...new Set(
      data.rows
        .map((row) => row.jinisId)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const settleJinisIds = [
    ...new Set(
      data.rows
        .filter((row) => row.settle && row.jinisId)
        .map((row) => row.jinisId as string),
    ),
  ]

  const written = await prisma.$transaction(
    async (tx) => {
      if (jinisIds.length > 0) {
        const jinisRecords = await tx.jinis.findMany({
          where: { id: { in: jinisIds } },
          select: { id: true, active: true },
        })
        const jinisById = new Map(
          jinisRecords.map((record) => [record.id, record]),
        )

        for (const id of jinisIds) {
          const jinis = jinisById.get(id)
          if (!jinis) {
            throw new Error('Jinis was not found.')
          }
          if (!jinis.active) {
            throw new Error(SETTLED_LINK_ERROR)
          }
        }
      }

      await tx.interest.createMany({
        data: data.rows.map((row) => ({
          amount: row.amount,
          date: canonicalizeCalendarDate(row.date),
          jinisId: row.jinisId ?? null,
          personName: row.personName || null,
          createdById,
        })),
      })

      const settledAt =
        settleJinisIds.length > 0
          ? canonicalizeCalendarDate(new Date())
          : null

      if (settledAt) {
        await tx.jinis.updateMany({
          where: { id: { in: settleJinisIds } },
          data: {
            active: false,
            settledAt,
          },
        })
      }

      return {
        imported: data.rows.length,
        dates: [
          ...data.rows.map((row) => canonicalizeCalendarDate(row.date)),
          settledAt,
        ],
      }
    },
    { timeout: 120_000 },
  )

  await refreshDailyCalculationsForDates(written.dates)

  return { imported: written.imported }
}
