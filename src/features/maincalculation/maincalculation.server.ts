import { prisma } from '#/db'
import type { MainCalculationWhereInput } from '#/generated/prisma/models/MainCalculation'
import { paginationArgs } from '#/lib/pagination'
import { sumPersonMoneyTotal } from '#/features/dailycalculation/dailycalculation.utils'
import { sumActiveJinisCredit } from '#/features/jinis/jinis.server'

import type {
  CreateMainCalculationInput,
  ListAvailableDailyCalculationsInput,
  ListMainCalculationInput,
  MainCalculationIdInput,
  MainCalculationInput,
  MainCalculationTotals,
  PreviewMainCalculationInput,
  UpdateMainCalculationInput,
} from './maincalculation.types'
import { deriveMainCalculationTotals } from './maincalculation.utils'

const relatedInclude = {
  dailyCalculation: {
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      recordStatus: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  lastEditedBy: {
    select: {
      id: true,
      name: true,
    },
  },
} as const

function toDayString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999`)
}

function jinisCharaOutstandingAsOf(calculationDate: Date) {
  const asOfEnd = dayEnd(toDayString(calculationDate))
  return {
    date: { lte: asOfEnd },
    OR: [{ settledAt: null }, { settledAt: { gt: asOfEnd } }],
  }
}

function inclusivePeriod(periodStart: Date, periodEnd: Date) {
  return {
    periodStart: dayStart(toDayString(periodStart)),
    periodEnd: dayEnd(toDayString(periodEnd)),
  }
}

async function computeLinkedDailyCalculationValues(dailyCalculationId: string) {
  const dailyCalculation = await prisma.dailyCalculation.findUniqueOrThrow({
    where: { id: dailyCalculationId },
    select: {
      periodStart: true,
      periodEnd: true,
      cashInHome: true,
      cashInShop: true,
      personMoneyEntries: {
        select: { amount: true },
      },
    },
  })

  const { periodStart, periodEnd } = inclusivePeriod(
    dailyCalculation.periodStart,
    dailyCalculation.periodEnd,
  )
  const inPeriod = {
    gte: periodStart,
    lte: periodEnd,
  }

  const interestInPeriod = await prisma.interest.aggregate({
    where: { date: inPeriod },
    _sum: { amount: true },
  })

  return {
    interest: interestInPeriod._sum.amount ?? 0,
    cash:
      dailyCalculation.cashInHome +
      dailyCalculation.cashInShop +
      sumPersonMoneyTotal(dailyCalculation.personMoneyEntries),
  }
}

export async function validateDailyCalculationForMainCalc(
  dailyCalculationId: string,
  excludeId?: string,
) {
  const dailyCalculation = await prisma.dailyCalculation.findUnique({
    where: { id: dailyCalculationId },
    select: { id: true, recordStatus: true },
  })

  if (!dailyCalculation) {
    throw new Error('Daily Calculation not found.')
  }

  if (dailyCalculation.recordStatus !== 'OPEN') {
    throw new Error('Daily Calculation must be open.')
  }

  const linked = await prisma.mainCalculation.findUnique({
    where: { dailyCalculationId },
    select: { id: true },
  })

  if (linked && linked.id !== excludeId) {
    throw new Error(
      'This Daily Calculation is already linked to a Main Calculation.',
    )
  }
}

export async function calculateMainCalculationTotals(input: {
  dailyCalculationId: string
  totalTabil: number
  calculationDate: Date
  excludeMainCalculationId?: string
}): Promise<MainCalculationTotals> {
  await validateDailyCalculationForMainCalc(
    input.dailyCalculationId,
    input.excludeMainCalculationId,
  )

  const [linkedDailyValues, bandak, jinisCharaAgg] = await Promise.all([
    computeLinkedDailyCalculationValues(input.dailyCalculationId),
    sumActiveJinisCredit(),
    prisma.jinisChara.aggregate({
      where: jinisCharaOutstandingAsOf(input.calculationDate),
      _sum: { credit: true },
    }),
  ])

  const interest = linkedDailyValues.interest
  const cash = linkedDailyValues.cash
  const jinisChara = jinisCharaAgg._sum.credit ?? 0

  return {
    interest,
    bandak,
    jinisChara,
    cash,
    ...deriveMainCalculationTotals({
      totalTabil: input.totalTabil,
      interest,
      bandak,
      jinisChara,
      cash,
    }),
  }
}

export async function previewMainCalculationTotals(
  input: PreviewMainCalculationInput,
) {
  return calculateMainCalculationTotals(input)
}

export async function listMainCalculationRecords(
  data: ListMainCalculationInput,
) {
  const filters: MainCalculationWhereInput[] = []

  if (data.recordStatus) {
    filters.push({ recordStatus: data.recordStatus })
  }

  if (data.balanceStatus) {
    filters.push({ balanceStatus: data.balanceStatus })
  }

  if (data.from || data.to) {
    filters.push({
      calculationDate: {
        ...(data.from ? { gte: dayStart(data.from) } : {}),
        ...(data.to ? { lte: dayEnd(data.to) } : {}),
      },
    })
  }

  const where = filters.length ? { AND: filters } : undefined
  const { page, pageSize, skip, take } = paginationArgs(data.page, data.pageSize)

  const [records, total] = await Promise.all([
    prisma.mainCalculation.findMany({
      where,
      orderBy: [{ calculationDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
      select: {
        id: true,
        calculationDate: true,
        totalTabil: true,
        dailyCalculationId: true,
        interest: true,
        bandak: true,
        jinisChara: true,
        cash: true,
        leftTotal: true,
        rightTotal: true,
        difference: true,
        balanceStatus: true,
        recordStatus: true,
        finalizedAt: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        lastEditedById: true,
        lastEditedAt: true,
        dailyCalculation: relatedInclude.dailyCalculation,
      },
    }),
    prisma.mainCalculation.count({ where }),
  ])

  return { records, total, page, pageSize }
}

export async function refreshMainCalculationTotalsRecord(
  data: MainCalculationIdInput,
  editedById?: string,
) {
  const existing = await prisma.mainCalculation.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  const totals = await calculateMainCalculationTotals({
    dailyCalculationId: existing.dailyCalculationId,
    totalTabil: existing.totalTabil,
    calculationDate: existing.calculationDate,
    excludeMainCalculationId: existing.id,
  })

  return prisma.mainCalculation.update({
    where: { id: data.id },
    data: {
      ...buildCalculatedData(
        {
          calculationDate: existing.calculationDate,
          totalTabil: existing.totalTabil,
          dailyCalculationId: existing.dailyCalculationId,
        },
        totals,
      ),
      ...(editedById
        ? {
            lastEditedById: editedById,
            lastEditedAt: new Date(),
          }
        : {}),
    },
    include: relatedInclude,
  })
}

export async function getMainCalculationRecord(data: MainCalculationIdInput) {
  return prisma.mainCalculation.findUnique({
    where: { id: data.id },
    include: relatedInclude,
  })
}

export async function listAvailableDailyCalculations(
  data: ListAvailableDailyCalculationsInput = {},
) {
  let allowDailyCalculationId: string | undefined

  if (data.excludeMainCalculationId) {
    const current = await prisma.mainCalculation.findUnique({
      where: { id: data.excludeMainCalculationId },
      select: { dailyCalculationId: true },
    })
    allowDailyCalculationId = current?.dailyCalculationId
  }

  const linked = await prisma.mainCalculation.findMany({
    where: data.excludeMainCalculationId
      ? { id: { not: data.excludeMainCalculationId } }
      : undefined,
    select: { dailyCalculationId: true },
  })

  const takenIds = new Set(linked.map((row) => row.dailyCalculationId))

  const openDailyCalculations = await prisma.dailyCalculation.findMany({
    where: { recordStatus: 'OPEN' },
    orderBy: { periodEnd: 'desc' },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      recordStatus: true,
      sudh: true,
      rightTotal: true,
    },
  })

  return openDailyCalculations.map((row) => ({
    ...row,
    isAvailable:
      !takenIds.has(row.id) || row.id === allowDailyCalculationId,
  }))
}

function buildCalculatedData(
  input: MainCalculationInput,
  totals: MainCalculationTotals,
) {
  return {
    calculationDate: input.calculationDate,
    totalTabil: input.totalTabil,
    dailyCalculationId: input.dailyCalculationId,
    interest: totals.interest,
    bandak: totals.bandak,
    jinisChara: totals.jinisChara,
    cash: totals.cash,
    leftTotal: totals.leftTotal,
    rightTotal: totals.rightTotal,
    difference: totals.difference,
    balanceStatus: totals.balanceStatus,
  }
}

export async function createMainCalculationRecord(
  data: CreateMainCalculationInput,
  createdById: string,
) {
  await validateDailyCalculationForMainCalc(data.dailyCalculationId)

  const totals = await calculateMainCalculationTotals(data)

  return prisma.mainCalculation.create({
    data: {
      ...buildCalculatedData(data, totals),
      recordStatus: 'DRAFT',
      createdById,
    },
    include: relatedInclude,
  })
}

export async function updateMainCalculationRecord(
  data: UpdateMainCalculationInput,
  editedById: string,
) {
  const existing = await prisma.mainCalculation.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  const nextInput: MainCalculationInput = {
    calculationDate: data.calculationDate ?? existing.calculationDate,
    totalTabil: data.totalTabil ?? existing.totalTabil,
    dailyCalculationId: data.dailyCalculationId ?? existing.dailyCalculationId,
  }

  await validateDailyCalculationForMainCalc(
    nextInput.dailyCalculationId,
    data.id,
  )

  const totals = await calculateMainCalculationTotals({
    ...nextInput,
    excludeMainCalculationId: data.id,
  })

  return prisma.mainCalculation.update({
    where: { id: data.id },
    data: {
      ...buildCalculatedData(nextInput, totals),
      lastEditedById: editedById,
      lastEditedAt: new Date(),
    },
    include: relatedInclude,
  })
}

export async function finalizeMainCalculationRecord(
  data: MainCalculationIdInput,
  editedById: string,
) {
  const existing = await prisma.mainCalculation.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  if (existing.recordStatus !== 'DRAFT') {
    throw new Error('Only draft Main Calculations can be finalized.')
  }

  const totals = await calculateMainCalculationTotals({
    dailyCalculationId: existing.dailyCalculationId,
    totalTabil: existing.totalTabil,
    calculationDate: existing.calculationDate,
    excludeMainCalculationId: data.id,
  })

  return prisma.mainCalculation.update({
    where: { id: data.id },
    data: {
      ...buildCalculatedData(
        {
          calculationDate: existing.calculationDate,
          totalTabil: existing.totalTabil,
          dailyCalculationId: existing.dailyCalculationId,
        },
        totals,
      ),
      recordStatus: 'FINALIZED',
      finalizedAt: new Date(),
      lastEditedById: editedById,
      lastEditedAt: new Date(),
    },
    include: relatedInclude,
  })
}

export async function deleteMainCalculationRecord(data: MainCalculationIdInput) {
  const existing = await prisma.mainCalculation.findUnique({
    where: { id: data.id },
    select: { id: true },
  })

  if (!existing) {
    return null
  }

  await prisma.mainCalculation.delete({ where: { id: data.id } })
  return { id: data.id }
}
