import { prisma } from '#/db'
import type { DailyCalculationWhereInput } from '#/generated/prisma/models/DailyCalculation'
import { paginationArgs } from '#/lib/pagination'

import type {
  CloseDailyCalculationInput,
  CreateDailyCalculationInput,
  DailyCalculationAsolSudhRow,
  DailyCalculationDeoyaRow,
  DailyCalculationIdInput,
  DailyCalculationPersonMoneyInput,
  DailyCalculationTotals,
  ListDailyCalculationInput,
  UpdateDailyCalculationInput,
} from './dailycalculation.types'
import {
  deriveDailyCalculationTotals,
  sumPersonMoneyTotal,
} from './dailycalculation.utils'

const relatedUserSelect = {
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

const relatedInclude = {
  personMoneyEntries: {
    orderBy: { createdAt: 'asc' as const },
  },
  ...relatedUserSelect,
}

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

function inclusivePeriod(periodStart: Date, periodEnd: Date) {
  return {
    periodStart: dayStart(toDayString(periodStart)),
    periodEnd: dayEnd(toDayString(periodEnd)),
  }
}

function personMoneyCreateData(
  entries: DailyCalculationPersonMoneyInput[],
) {
  return entries.map((entry) => ({
    personName: entry.personName,
    amount: entry.amount,
    remarks: entry.remarks || null,
  }))
}

async function assertNoOverlappingPeriod(
  periodStart: Date,
  periodEnd: Date,
  excludeId?: string,
) {
  if (periodStart.getTime() > periodEnd.getTime()) {
    throw new Error('Period start must be on or before period end.')
  }

  const overlapping = await prisma.dailyCalculation.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart },
    },
    select: { id: true },
  })

  if (overlapping) {
    throw new Error('This period overlaps an existing Daily Calculation.')
  }
}

async function computeAsolForPeriod(periodStart: Date, periodEnd: Date) {
  const inPeriod = {
    gte: periodStart,
    lte: periodEnd,
  }

  const [settledJinis, settledJinisChara] = await Promise.all([
    prisma.jinis.aggregate({
      where: { settledAt: inPeriod },
      _sum: { credit: true },
    }),
    prisma.jinisChara.aggregate({
      where: { settledAt: inPeriod },
      _sum: { credit: true },
    }),
  ])

  return (settledJinis._sum.credit ?? 0) + (settledJinisChara._sum.credit ?? 0)
}

async function computePeriodTotals(input: {
  periodStart: Date
  periodEnd: Date
  tabil: number
  cashInHome: number
  cashInShop: number
  personMoneyEntries: { amount: number }[]
}): Promise<DailyCalculationTotals> {
  const { periodStart, periodEnd } = input
  const inPeriod = {
    gte: periodStart,
    lte: periodEnd,
  }

  const [
    asol,
    interestInPeriod,
    issuedJinis,
    issuedJinisChara,
  ] = await Promise.all([
    computeAsolForPeriod(periodStart, periodEnd),
    prisma.interest.aggregate({
      where: { date: inPeriod },
      _sum: { amount: true },
    }),
    prisma.jinis.aggregate({
      where: { date: inPeriod },
      _sum: { credit: true },
    }),
    prisma.jinisChara.aggregate({
      where: { date: inPeriod },
      _sum: { credit: true },
    }),
  ])

  const sudh = interestInPeriod._sum.amount ?? 0
  const deoya =
    (issuedJinis._sum.credit ?? 0) + (issuedJinisChara._sum.credit ?? 0)
  const personMoneyTotal = sumPersonMoneyTotal(input.personMoneyEntries)
  const derived = deriveDailyCalculationTotals({
    tabil: input.tabil,
    asol,
    sudh,
    deoya,
    cashInHome: input.cashInHome,
    cashInShop: input.cashInShop,
    personMoneyTotal,
  })

  return {
    asol,
    sudh,
    deoya,
    personMoneyTotal,
    ...derived,
  }
}

export async function previewDailyCalculationTotals(
  data: CreateDailyCalculationInput,
) {
  const period = inclusivePeriod(data.periodStart, data.periodEnd)
  return computePeriodTotals({
    ...period,
    tabil: data.tabil,
    cashInHome: data.cashInHome,
    cashInShop: data.cashInShop,
    personMoneyEntries: data.personMoneyEntries,
  })
}

export async function listDailyCalculationRecords(
  data: ListDailyCalculationInput,
) {
  const filters: DailyCalculationWhereInput[] = []

  if (data.recordStatus) {
    filters.push({ recordStatus: data.recordStatus })
  }

  if (data.balanceStatus) {
    filters.push({ balanceStatus: data.balanceStatus })
  }

  if (data.from || data.to) {
    filters.push({
      ...(data.to ? { periodStart: { lte: dayEnd(data.to) } } : {}),
      ...(data.from ? { periodEnd: { gte: dayStart(data.from) } } : {}),
    })
  }

  const where = filters.length ? { AND: filters } : undefined
  const { page, pageSize, skip, take } = paginationArgs(data.page, data.pageSize)

  const [records, total] = await Promise.all([
    prisma.dailyCalculation.findMany({
      where,
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        tabil: true,
        cashInHome: true,
        cashInShop: true,
        asol: true,
        sudh: true,
        deoya: true,
        personMoneyTotal: true,
        leftTotal: true,
        rightTotal: true,
        difference: true,
        balanceStatus: true,
        recordStatus: true,
        openedAt: true,
        closedAt: true,
      },
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    prisma.dailyCalculation.count({ where }),
  ])

  return { records, total, page, pageSize }
}

export async function getDailyCalculationRecord(data: DailyCalculationIdInput) {
  return prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    include: relatedInclude,
  })
}

function compareDetailRows<
  T extends { date: Date | string; slNo: number; source: string },
>(a: T, b: T) {
  const dateCompare =
    new Date(a.date).getTime() - new Date(b.date).getTime()
  if (dateCompare !== 0) return dateCompare
  const sourceCompare = a.source.localeCompare(b.source)
  if (sourceCompare !== 0) return sourceCompare
  return a.slNo - b.slNo
}

export async function refreshDailyCalculationTotalsRecord(
  data: DailyCalculationIdInput,
  editedById?: string,
) {
  const existing = await prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    include: { personMoneyEntries: true },
  })

  if (!existing) {
    return null
  }

  const period = inclusivePeriod(existing.periodStart, existing.periodEnd)
  const totals = await computePeriodTotals({
    ...period,
    tabil: existing.tabil,
    cashInHome: existing.cashInHome,
    cashInShop: existing.cashInShop,
    personMoneyEntries: existing.personMoneyEntries,
  })

  return prisma.dailyCalculation.update({
    where: { id: data.id },
    data: {
      ...totals,
      ...(editedById
        ? {
            lastEditedById: editedById,
            lastEditedAt: new Date(),
          }
        : {}),
    },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      recordStatus: true,
      tabil: true,
      cashInHome: true,
      cashInShop: true,
      asol: true,
      sudh: true,
      deoya: true,
      personMoneyTotal: true,
      leftTotal: true,
      rightTotal: true,
      difference: true,
      balanceStatus: true,
      personMoneyEntries: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          personName: true,
          amount: true,
          remarks: true,
          dailyCalculationId: true,
        },
      },
    },
  })
}

type SettledLoanForAsolSudh = {
  id: string
  slNo: number
  credit: number
  settledAt: Date | null
  interests: { id: string; amount: number; date: Date }[]
}

type PeriodInterestForAsolSudh = {
  id: string
  amount: number
  date: Date
  personName: string | null
  jinis: {
    id: string
    slNo: number
    credit: number
    settledAt: Date | null
  } | null
  jinisChara: {
    id: string
    slNo: number
    credit: number
    settledAt: Date | null
  } | null
}

function settledLoanCredit(
  loan: { credit: number; settledAt: Date | null } | null | undefined,
) {
  return loan?.settledAt ? loan.credit : 0
}

function pushSettledLoanAsolSudhRows(
  asolSudhRows: DailyCalculationAsolSudhRow[],
  includedInterestIds: Set<string>,
  loans: SettledLoanForAsolSudh[],
  source: 'Jinis' | 'JinisChara',
) {
  for (const row of loans) {
    if (!row.settledAt) continue

    if (row.interests.length === 0) {
      asolSudhRows.push({
        recordId: row.id,
        interestId: null,
        slNo: row.slNo,
        personName: null,
        amount: row.credit,
        sudh: 0,
        date: row.settledAt,
        source,
      })
      continue
    }

    for (const interest of row.interests) {
      includedInterestIds.add(interest.id)
      asolSudhRows.push({
        recordId: row.id,
        interestId: interest.id,
        slNo: row.slNo,
        personName: null,
        amount: row.credit,
        sudh: interest.amount,
        date: interest.date,
        source,
      })
    }
  }
}

function buildAsolSudhRows(
  settledJinis: SettledLoanForAsolSudh[],
  settledJinisChara: SettledLoanForAsolSudh[],
  periodInterests: PeriodInterestForAsolSudh[],
) {
  const asolSudhRows: DailyCalculationAsolSudhRow[] = []
  const includedInterestIds = new Set<string>()

  pushSettledLoanAsolSudhRows(
    asolSudhRows,
    includedInterestIds,
    settledJinis,
    'Jinis',
  )
  pushSettledLoanAsolSudhRows(
    asolSudhRows,
    includedInterestIds,
    settledJinisChara,
    'JinisChara',
  )

  for (const interest of periodInterests) {
    if (includedInterestIds.has(interest.id)) continue

    if (interest.jinis) {
      asolSudhRows.push({
        recordId: interest.jinis.id,
        interestId: interest.id,
        slNo: interest.jinis.slNo,
        personName: null,
        amount: settledLoanCredit(interest.jinis),
        sudh: interest.amount,
        date: interest.date,
        source: 'Jinis',
      })
      continue
    }

    if (interest.jinisChara) {
      asolSudhRows.push({
        recordId: interest.jinisChara.id,
        interestId: interest.id,
        slNo: interest.jinisChara.slNo,
        personName: null,
        amount: settledLoanCredit(interest.jinisChara),
        sudh: interest.amount,
        date: interest.date,
        source: 'JinisChara',
      })
      continue
    }

    asolSudhRows.push({
      recordId: interest.id,
      interestId: interest.id,
      slNo: 0,
      personName: interest.personName,
      amount: 0,
      sudh: interest.amount,
      date: interest.date,
      source: 'Person',
    })
  }

  return asolSudhRows.sort(compareDetailRows)
}

export async function getDailyCalculationDetailRecord(
  data: DailyCalculationIdInput,
) {
  const record = await prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      recordStatus: true,
      openedAt: true,
      closedAt: true,
      tabil: true,
      cashInHome: true,
      cashInShop: true,
      asol: true,
      sudh: true,
      deoya: true,
      personMoneyTotal: true,
      leftTotal: true,
      rightTotal: true,
      difference: true,
      balanceStatus: true,
      personMoneyEntries: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          personName: true,
          amount: true,
          remarks: true,
          dailyCalculationId: true,
        },
      },
    },
  })

  if (!record) {
    return null
  }

  const { periodStart, periodEnd } = inclusivePeriod(
    record.periodStart,
    record.periodEnd,
  )
  const inPeriod = {
    gte: periodStart,
    lte: periodEnd,
  }

  const [
    issuedJinis,
    issuedJinisChara,
    settledJinis,
    settledJinisChara,
    periodInterests,
  ] = await Promise.all([
      prisma.jinis.findMany({
        where: { date: inPeriod },
        select: { id: true, slNo: true, credit: true, date: true },
      }),
      prisma.jinisChara.findMany({
        where: { date: inPeriod },
        select: { id: true, slNo: true, credit: true, date: true },
      }),
      prisma.jinis.findMany({
        where: { settledAt: inPeriod },
        select: {
          id: true,
          slNo: true,
          credit: true,
          settledAt: true,
          interests: {
            where: { date: inPeriod },
            select: { id: true, amount: true, date: true },
            orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          },
        },
      }),
      prisma.jinisChara.findMany({
        where: { settledAt: inPeriod },
        select: {
          id: true,
          slNo: true,
          credit: true,
          settledAt: true,
          interests: {
            where: { date: inPeriod },
            select: { id: true, amount: true, date: true },
            orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          },
        },
      }),
      prisma.interest.findMany({
        where: { date: inPeriod },
        select: {
          id: true,
          amount: true,
          date: true,
          personName: true,
          jinis: {
            select: { id: true, slNo: true, credit: true, settledAt: true },
          },
          jinisChara: {
            select: { id: true, slNo: true, credit: true, settledAt: true },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
    ])

  const deoyaRows: DailyCalculationDeoyaRow[] = [
    ...issuedJinis.map((row) => ({
      recordId: row.id,
      slNo: row.slNo,
      amount: row.credit,
      date: row.date,
      source: 'Jinis' as const,
    })),
    ...issuedJinisChara.map((row) => ({
      recordId: row.id,
      slNo: row.slNo,
      amount: row.credit,
      date: row.date,
      source: 'JinisChara' as const,
    })),
  ].sort(compareDetailRows)

  const asolSudhRows = buildAsolSudhRows(
    settledJinis,
    settledJinisChara,
    periodInterests,
  )

  return {
    ...record,
    deoyaRows,
    asolSudhRows,
  }
}

export async function createDailyCalculationRecord(
  data: CreateDailyCalculationInput,
  createdById: string,
) {
  const period = inclusivePeriod(data.periodStart, data.periodEnd)
  await assertNoOverlappingPeriod(period.periodStart, period.periodEnd)

  const totals = await computePeriodTotals({
    ...period,
    tabil: data.tabil,
    cashInHome: data.cashInHome,
    cashInShop: data.cashInShop,
    personMoneyEntries: data.personMoneyEntries,
  })

  return prisma.dailyCalculation.create({
    data: {
      ...period,
      tabil: data.tabil,
      cashInHome: data.cashInHome,
      cashInShop: data.cashInShop,
      ...totals,
      createdById,
      personMoneyEntries: {
        create: personMoneyCreateData(data.personMoneyEntries),
      },
    },
    include: relatedInclude,
  })
}

export async function updateDailyCalculationRecord(
  data: UpdateDailyCalculationInput,
  editedById: string,
) {
  const existing = await prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    include: { personMoneyEntries: true },
  })

  if (!existing) {
    return null
  }

  const period = inclusivePeriod(
    data.periodStart ?? existing.periodStart,
    data.periodEnd ?? existing.periodEnd,
  )
  await assertNoOverlappingPeriod(
    period.periodStart,
    period.periodEnd,
    existing.id,
  )

  const personMoneyEntries =
    data.personMoneyEntries ?? existing.personMoneyEntries
  const tabil = data.tabil ?? existing.tabil
  const cashInHome = data.cashInHome ?? existing.cashInHome
  const cashInShop = data.cashInShop ?? existing.cashInShop
  const totals = await computePeriodTotals({
    ...period,
    tabil,
    cashInHome,
    cashInShop,
    personMoneyEntries,
  })

  return prisma.dailyCalculation.update({
    where: { id: data.id },
    data: {
      ...period,
      tabil,
      cashInHome,
      cashInShop,
      ...totals,
      lastEditedById: editedById,
      lastEditedAt: new Date(),
      ...(data.personMoneyEntries
        ? {
            personMoneyEntries: {
              deleteMany: {},
              create: personMoneyCreateData(data.personMoneyEntries),
            },
          }
        : {}),
    },
    include: relatedInclude,
  })
}

export async function closeDailyCalculationRecord(
  data: CloseDailyCalculationInput,
  editedById: string,
) {
  const existing = await prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    include: { personMoneyEntries: true },
  })

  if (!existing) {
    return null
  }

  const period = inclusivePeriod(existing.periodStart, existing.periodEnd)
  const totals = await computePeriodTotals({
    ...period,
    tabil: existing.tabil,
    cashInHome: existing.cashInHome,
    cashInShop: existing.cashInShop,
    personMoneyEntries: existing.personMoneyEntries,
  })

  return prisma.dailyCalculation.update({
    where: { id: data.id },
    data: {
      ...totals,
      recordStatus: 'CLOSED',
      closedAt: data.closedAt ?? new Date(),
      lastEditedById: editedById,
      lastEditedAt: new Date(),
    },
    include: relatedInclude,
  })
}

export async function deleteDailyCalculationRecord(
  data: DailyCalculationIdInput,
) {
  const existing = await prisma.dailyCalculation.findUnique({
    where: { id: data.id },
    select: { id: true },
  })

  if (!existing) {
    return null
  }

  await prisma.$transaction(async (tx) => {
    await tx.mainCalculation.deleteMany({
      where: { dailyCalculationId: data.id },
    })

    await tx.dailyCalculation.delete({
      where: { id: data.id },
    })
  })

  return { id: data.id }
}
