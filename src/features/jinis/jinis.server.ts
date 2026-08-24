import { prisma } from '#/db'
import type { JinisWhereInput } from '#/generated/prisma/models/Jinis'
import {
  LINK_OPTIONS_LIMIT,
  paginationArgs,
} from '#/lib/pagination'

import { sumJinisWeights } from './jinis.utils'
import type {
  CreateJinisInput,
  JinisIdInput,
  ListJinisInput,
  SettleJinisInput,
  UpdateJinisInput,
} from './jinis.types'

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999`)
}

const jinisListSelect = {
  id: true,
  slNo: true,
  name: true,
  fatherName: true,
  phoneNo: true,
  credit: true,
  type: true,
  goldWeight: true,
  silverWeight: true,
  date: true,
  active: true,
  settledAt: true,
} as const

async function buildJinisWhereFilters(data: ListJinisInput) {
  const filters: JinisWhereInput[] = []

  if (data.active !== undefined) {
    filters.push({ active: data.active })
  }

  if (data.slNo) {
    const trimmed = data.slNo.trim()
    const asNumber = Number(trimmed)
    if (Number.isInteger(asNumber) && String(asNumber) === trimmed) {
      filters.push({ slNo: asNumber })
    } else {
      const matches = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Jinis"
        WHERE CAST("slNo" AS TEXT) ILIKE ${`%${trimmed}%`}
      `
      filters.push(
        matches.length > 0
          ? { id: { in: matches.map((row) => row.id) } }
          : { id: '__none__' },
      )
    }
  }

  if (data.name) {
    filters.push({
      name: { contains: data.name, mode: 'insensitive' },
    })
  }

  if (data.fatherName) {
    filters.push({
      fatherName: { contains: data.fatherName, mode: 'insensitive' },
    })
  }

  if (data.phoneNo) {
    filters.push({
      phoneNo: { contains: data.phoneNo, mode: 'insensitive' },
    })
  }

  if (data.type) {
    filters.push({ type: data.type })
  }

  if (data.creditMin !== undefined || data.creditMax !== undefined) {
    filters.push({
      credit: {
        ...(data.creditMin !== undefined ? { gte: data.creditMin } : {}),
        ...(data.creditMax !== undefined ? { lte: data.creditMax } : {}),
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

export async function listJinisRecords(data: ListJinisInput) {
  const where = await buildJinisWhereFilters(data)
  const { page, pageSize, skip, take } = paginationArgs(data.page, data.pageSize)
  const filterWhere = await buildJinisWhereFilters({
    ...data,
    active: undefined,
  })
  const andClause = filterWhere?.AND ?? []

  const [records, total, allCount, activeCount] = await Promise.all([
    prisma.jinis.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take,
      select: jinisListSelect,
    }),
    prisma.jinis.count({ where }),
    prisma.jinis.count({ where: filterWhere }),
    prisma.jinis.count({
      where: { AND: [...andClause, { active: true }] },
    }),
  ])

  return { records, total, allCount, activeCount, page, pageSize }
}

export async function listJinisLinkOptions(query?: string) {
  const trimmed = query?.trim()
  const filters: JinisWhereInput[] = []

  if (trimmed) {
    const asNumber = Number(trimmed)
    filters.push({
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        ...(Number.isInteger(asNumber) && String(asNumber) === trimmed
          ? [{ slNo: asNumber }]
          : []),
      ],
    })
  }

  return prisma.jinis.findMany({
    where: filters.length ? { AND: filters } : undefined,
    select: {
      id: true,
      slNo: true,
      name: true,
    },
    orderBy: { slNo: 'desc' },
    take: LINK_OPTIONS_LIMIT,
  })
}

export async function getJinisRecord(data: JinisIdInput) {
  return prisma.jinis.findUnique({
    where: { id: data.id },
    include: { items: true },
  })
}

export async function createJinisRecord(
  data: CreateJinisInput,
  createdById: string,
) {
  const weights = sumJinisWeights(data.items)

  return prisma.jinis.create({
    data: {
      slNo: data.slNo,
      name: data.name,
      fatherName: data.fatherName,
      phoneNo: data.phoneNo,
      credit: data.credit,
      type: data.type,
      date: data.date,
      active: data.active,
      goldWeight: weights.goldWeight,
      silverWeight: weights.silverWeight,
      createdById,
      items: {
        create: data.items,
      },
    },
    include: { items: true },
  })
}

export async function updateJinisRecord(data: UpdateJinisInput) {
  const existing = await prisma.jinis.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  const { id, items, ...fields } = data
  const weights = items ? sumJinisWeights(items) : null

  return prisma.jinis.update({
    where: { id },
    data: {
      ...fields,
      ...(weights && items
        ? {
            goldWeight: weights.goldWeight,
            silverWeight: weights.silverWeight,
            items: {
              deleteMany: {},
              create: items,
            },
          }
        : {}),
    },
    include: { items: true },
  })
}

export async function deleteJinisRecord(data: JinisIdInput) {
  const existing = await prisma.jinis.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  await prisma.jinis.delete({
    where: { id: data.id },
  })

  return { id: data.id }
}

export async function settleJinisRecord(data: SettleJinisInput) {
  const existing = await prisma.jinis.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  return prisma.jinis.update({
    where: { id: data.id },
    data: {
      active: false,
      settledAt: data.settledAt ?? new Date(),
    },
    include: { items: true },
  })
}

export async function sumActiveJinisCredit() {
  const result = await prisma.jinis.aggregate({
    where: { active: true },
    _sum: { credit: true },
  })

  return result._sum.credit ?? 0
}
