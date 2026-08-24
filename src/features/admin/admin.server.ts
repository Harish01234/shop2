import { refreshAllDailyCalculationTotals, refreshDailyCalculationsForDates } from '#/features/dailycalculation/dailycalculation.server'
import {
  canonicalizeCalendarDate,
  dayEnd,
  dayStart,
  toCalendarDay,
  toDateInput,
} from '#/lib/calendar-date'
import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'

import { prisma } from '#/db'

import type {
  AdminExportInput,
  AdminJinisCharaImportInput,
  AdminJinisImportInput,
  AdminSessionRecord,
} from './admin.types'

type SessionWithUser = {
  id: string
  userId: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  user: {
    name: string
    email: string
  }
}

function isActiveSession(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime()
}

function toSessionRecord(
  session: SessionWithUser,
  currentSessionId?: string,
): AdminSessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    userName: session.user.name,
    userEmail: session.user.email,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    active: isActiveSession(session.expiresAt),
    current: session.id === currentSessionId,
  }
}

const sessionSelect = {
  id: true,
  userId: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} as const

export async function getAdminOverview(currentSessionId: string) {
  const now = new Date()
  const [userCount, activeSessionCount, jinisCount, jinisCharaCount, recent] =
    await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.jinis.count(),
    prisma.jinisChara.count(),
    prisma.session.findMany({
      take: 8,
      orderBy: { updatedAt: 'desc' },
      select: sessionSelect,
    }),
  ])

  return {
    userCount,
    activeSessionCount,
    jinisCount,
    jinisCharaCount,
    recentSessions: recent.map((session) =>
      toSessionRecord(session, currentSessionId),
    ),
  }
}

export async function listAdminSessions(currentSessionId: string) {
  const sessions = await prisma.session.findMany({
    orderBy: { updatedAt: 'desc' },
    select: sessionSelect,
  })

  return sessions.map((session) => toSessionRecord(session, currentSessionId))
}

export async function revokeAdminSession(id: string) {
  const existing = await prisma.session.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    return null
  }

  await prisma.session.delete({ where: { id } })
  return { id }
}

export async function importJinisCsv(
  input: AdminJinisImportInput,
  createdById: string,
) {
  const existing = await prisma.jinis.findMany({
    where: {
      slNo: { in: input.rows.map((row) => row.slNo) },
    },
    select: { slNo: true },
  })
  const existingSlNos = new Set(existing.map((row) => row.slNo))
  const toCreate = input.rows.filter((row) => !existingSlNos.has(row.slNo))

  if (toCreate.length > 0) {
    await prisma.jinis.createMany({
      data: toCreate.map((row) => ({
        slNo: row.slNo,
        name: row.name,
        fatherName: row.fatherName,
        phoneNo: row.phoneNo,
        credit: row.credit,
        type: 'UNKNOWN',
        date: canonicalizeCalendarDate(row.date),
        active: true,
        goldWeight: 0,
        silverWeight: 0,
        createdById,
      })),
    })
    await refreshDailyCalculationsForDates(
      toCreate.map((row) => canonicalizeCalendarDate(row.date)),
    )
  }

  return {
    imported: toCreate.length,
    skipped: input.rows.length - toCreate.length,
  }
}

export async function importJinisCharaCsv(
  input: AdminJinisCharaImportInput,
  createdById: string,
) {
  const existing = await prisma.jinisChara.findMany({
    where: {
      slNo: { in: input.rows.map((row) => row.slNo) },
    },
    select: { slNo: true },
  })
  const existingSlNos = new Set(existing.map((row) => row.slNo))
  const toCreate = input.rows.filter((row) => !existingSlNos.has(row.slNo))

  if (toCreate.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.jinisChara.createMany({
        data: toCreate.map((row) => ({
          slNo: row.slNo,
          name: row.name,
          fatherName: row.fatherName,
          phoneNo: row.phoneNo,
          credit: row.credit,
          percentage: row.percentage ?? DEFAULT_JINISCHARA_PERCENTAGE,
          description: row.description ?? null,
          date: canonicalizeCalendarDate(row.date),
          active: true,
          settledAt: null,
          createdById,
        })),
      })
    })
    await refreshDailyCalculationsForDates(
      toCreate.map((row) => canonicalizeCalendarDate(row.date)),
    )
  }

  return {
    imported: toCreate.length,
    skipped: input.rows.length - toCreate.length,
  }
}

export async function deleteAllJinisCharaRecords() {
  const result = await prisma.$transaction(async (tx) => {
    const payments = await tx.interest.deleteMany({
      where: { jinisCharaId: { not: null } },
    })
    const jinisChara = await tx.jinisChara.deleteMany()

    return {
      deleted: jinisChara.count,
      paymentsDeleted: payments.count,
    }
  })
  await refreshAllDailyCalculationTotals()
  return result
}

export async function deleteAllJinisRecords() {
  const result = await prisma.$transaction(async (tx) => {
    const payments = await tx.interest.deleteMany({
      where: { jinisId: { not: null } },
    })
    const jinis = await tx.jinis.deleteMany()

    return {
      deleted: jinis.count,
      paymentsDeleted: payments.count,
    }
  })
  await refreshAllDailyCalculationTotals()
  return result
}

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ]
  return `${lines.join('\n')}\n`
}

export async function exportAdminData(input: AdminExportInput) {
  const from = dayStart(toCalendarDay(input.from))
  const to = dayEnd(toCalendarDay(input.to))

  let rows: Array<Record<string, unknown>> = []

  if (input.type === 'users') {
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    })
    rows = users
  }

  if (input.type === 'jinis') {
    const jinis = await prisma.jinis.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'desc' },
      select: {
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
      },
    })
    rows = jinis
  }

  if (input.type === 'sessions') {
    const sessions = await prisma.session.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    rows = sessions.map((session) => ({
      id: session.id,
      userName: session.user.name,
      userEmail: session.user.email,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    }))
  }

  const stamp = toDateInput(new Date())
  if (input.format === 'json') {
    return {
      filename: `${input.type}-${stamp}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(rows, null, 2),
    }
  }

  return {
    filename: `${input.type}-${stamp}.csv`,
    mimeType: 'text/csv',
    content: toCsv(rows),
  }
}
