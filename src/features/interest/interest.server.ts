import { prisma } from '#/db'
import type { InterestWhereInput } from '#/generated/prisma/models/Interest'
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

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999`)
}

async function assertInterestTargets(data: {
  jinisId?: string | null
  jinisCharaId?: string | null
}) {
  if (data.jinisId) {
    const jinis = await prisma.jinis.findUnique({
      where: { id: data.jinisId },
      select: { id: true },
    })
    if (!jinis) {
      throw new Error('Jinis was not found.')
    }
  }

  if (data.jinisCharaId) {
    const jinisChara = await prisma.jinisChara.findUnique({
      where: { id: data.jinisCharaId },
      select: { id: true },
    })
    if (!jinisChara) {
      throw new Error('JinisChara was not found.')
    }
  }
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

  if (!settle) {
    await assertInterestTargets(data)

    return prisma.interest.create({
      data: {
        amount: data.amount,
        date: data.date,
        remarks: data.remarks || null,
        jinisId: data.jinisId,
        jinisCharaId: data.jinisCharaId,
        personName: data.personName || null,
        createdById,
      },
      include: relatedSelect,
    })
  }

  return prisma.$transaction(async (tx) => {
    if (data.jinisId) {
      const jinis = await tx.jinis.findUnique({
        where: { id: data.jinisId },
        select: { id: true },
      })
      if (!jinis) {
        throw new Error('Jinis was not found.')
      }
    }

    if (data.jinisCharaId) {
      const jinisChara = await tx.jinisChara.findUnique({
        where: { id: data.jinisCharaId },
        select: { id: true },
      })
      if (!jinisChara) {
        throw new Error('JinisChara was not found.')
      }
    }

    const interest = await tx.interest.create({
      data: {
        amount: data.amount,
        date: data.date,
        remarks: data.remarks || null,
        jinisId: data.jinisId,
        jinisCharaId: data.jinisCharaId,
        personName: data.personName || null,
        createdById,
      },
      include: relatedSelect,
    })

    const settledAt = new Date()

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

    return interest
  })
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

  return prisma.interest.update({
    where: { id },
    data: {
      ...fields,
      ...(fields.remarks !== undefined
        ? { remarks: fields.remarks || null }
        : {}),
      ...(fields.personName !== undefined
        ? { personName: fields.personName || null }
        : {}),
    },
    include: relatedSelect,
  })
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

  return { id: data.id }
}

export async function sumInterestAmount() {
  const result = await prisma.interest.aggregate({
    _sum: { amount: true },
  })

  return result._sum.amount ?? 0
}
