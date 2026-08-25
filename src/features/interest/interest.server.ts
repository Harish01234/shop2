import { prisma } from '#/db'
import type { InterestWhereInput } from '#/generated/prisma/models/Interest'
import { refreshDailyCalculationsForDates } from '#/features/dailycalculation/dailycalculation.server'
import { canonicalizeCalendarDate, dayEnd, dayStart } from '#/lib/calendar-date'
import { paginationArgs } from '#/lib/pagination'

import type {
  CreateInterestInput,
  InterestIdInput,
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

  const where = filters.length ? { AND: filters } : undefined
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

export async function getInterestRecord(data: InterestIdInput) {
  return prisma.interest.findUnique({
    where: { id: data.id },
    include: relatedSelect,
  })
}

export async function createInterestRecord(
  data: CreateInterestInput,
  createdById: string,
) {
  const settle = Boolean(data.settle)
  const date = canonicalizeCalendarDate(data.date)

  if (!settle) {
    await assertOpenLinkForNewInterest(data)

    const interest = await prisma.interest.create({
      data: {
        amount: data.amount,
        date,
        remarks: data.remarks || null,
        jinisId: data.jinisId,
        jinisCharaId: data.jinisCharaId,
        personName: data.personName || null,
        createdById,
      },
      include: relatedSelect,
    })

    await refreshDailyCalculationsForDates([interest.date])
    return interest
  }

  const interest = await prisma.$transaction(async (tx) => {
    await assertOpenLinkForNewInterest(data, tx)

    const created = await tx.interest.create({
      data: {
        amount: data.amount,
        date,
        remarks: data.remarks || null,
        jinisId: data.jinisId,
        jinisCharaId: data.jinisCharaId,
        personName: data.personName || null,
        createdById,
      },
      include: relatedSelect,
    })

    const settledAt = canonicalizeCalendarDate(new Date())

    if (data.jinisId) {
      await tx.jinis.update({
        where: { id: data.jinisId },
        data: {
          active: false,
          settledAt,
        },
      })
    }

    if (data.jinisCharaId) {
      await tx.jinisChara.update({
        where: { id: data.jinisCharaId },
        data: {
          active: false,
          settledAt,
        },
      })
    }

    return { created, settledAt }
  })

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

export async function sumInterestAmount() {
  const result = await prisma.interest.aggregate({
    _sum: { amount: true },
  })

  return result._sum.amount ?? 0
}
