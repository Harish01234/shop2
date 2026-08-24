import { prisma } from '#/db'
import type { JinisCharaWhereInput } from '#/generated/prisma/models/JinisChara'
import {
  LINK_OPTIONS_LIMIT,
  paginationArgs,
} from '#/lib/pagination'

import type {
  CreateJinisCharaInput,
  JinisCharaIdInput,
  ListJinisCharaInput,
  SettleJinisCharaInput,
  UpdateJinisCharaInput,
} from './jinischara.types'
import { DEFAULT_JINISCHARA_PERCENTAGE } from './jinischara.utils'

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`)
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999`)
}

const jinisCharaListSelect = {
  id: true,
  slNo: true,
  name: true,
  fatherName: true,
  phoneNo: true,
  credit: true,
  percentage: true,
  description: true,
  date: true,
  active: true,
  settledAt: true,
} as const

export async function listJinisCharaRecords(data: ListJinisCharaInput) {
  const where = await buildJinisCharaWhereFilters(data)
  const { page, pageSize, skip, take } = paginationArgs(data.page, data.pageSize)
  const filterWhere = await buildJinisCharaWhereFilters({
    ...data,
    active: undefined,
  })
  const andClause = filterWhere?.AND ?? []

  const [records, total, allCount, activeCount] = await Promise.all([
    prisma.jinisChara.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take,
      select: jinisCharaListSelect,
    }),
    prisma.jinisChara.count({ where }),
    prisma.jinisChara.count({ where: filterWhere }),
    prisma.jinisChara.count({
      where: { AND: [...andClause, { active: true }] },
    }),
  ])

  return { records, total, allCount, activeCount, page, pageSize }
}

export async function listJinisCharaLinkOptions(query?: string) {
  const trimmed = query?.trim()
  const filters: JinisCharaWhereInput[] = []

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

  return prisma.jinisChara.findMany({
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

async function buildJinisCharaWhereFilters(data: ListJinisCharaInput) {
  const filters: JinisCharaWhereInput[] = []

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
        SELECT id FROM "JinisChara"
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

  if (data.creditMin !== undefined || data.creditMax !== undefined) {
    filters.push({
      credit: {
        ...(data.creditMin !== undefined ? { gte: data.creditMin } : {}),
        ...(data.creditMax !== undefined ? { lte: data.creditMax } : {}),
      },
    })
  }

  if (data.percentageMin !== undefined || data.percentageMax !== undefined) {
    filters.push({
      percentage: {
        ...(data.percentageMin !== undefined ? { gte: data.percentageMin } : {}),
        ...(data.percentageMax !== undefined ? { lte: data.percentageMax } : {}),
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

export async function getJinisCharaRecord(data: JinisCharaIdInput) {
  return prisma.jinisChara.findUnique({
    where: { id: data.id },
  })
}

export async function createJinisCharaRecord(
  data: CreateJinisCharaInput,
  createdById: string,
) {
  return prisma.jinisChara.create({
    data: {
      slNo: data.slNo,
      name: data.name,
      fatherName: data.fatherName,
      phoneNo: data.phoneNo,
      credit: data.credit,
      percentage: data.percentage ?? DEFAULT_JINISCHARA_PERCENTAGE,
      description: data.description || null,
      date: data.date,
      active: data.active,
      createdById,
    },
  })
}

export async function updateJinisCharaRecord(data: UpdateJinisCharaInput) {
  const existing = await prisma.jinisChara.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  const { id, ...fields } = data

  return prisma.jinisChara.update({
    where: { id },
    data: {
      ...fields,
      ...(fields.description !== undefined
        ? { description: fields.description || null }
        : {}),
    },
  })
}

export async function deleteJinisCharaRecord(data: JinisCharaIdInput) {
  const existing = await prisma.jinisChara.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  await prisma.jinisChara.delete({
    where: { id: data.id },
  })

  return { id: data.id }
}

export async function settleJinisCharaRecord(data: SettleJinisCharaInput) {
  const existing = await prisma.jinisChara.findUnique({
    where: { id: data.id },
  })

  if (!existing) {
    return null
  }

  return prisma.jinisChara.update({
    where: { id: data.id },
    data: {
      active: false,
      settledAt: data.settledAt ?? new Date(),
    },
  })
}

export async function sumActiveJinisCharaCredit() {
  const result = await prisma.jinisChara.aggregate({
    where: { active: true },
    _sum: { credit: true },
  })

  return result._sum.credit ?? 0
}
