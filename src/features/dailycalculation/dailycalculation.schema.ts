import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'

export const dailyCalculationRecordStatusSchema = z.enum(['OPEN', 'CLOSED'])

export const dailyCalculationBalanceStatusSchema = z.enum([
  'CORRECT',
  'INCORRECT',
])

export const dailyCalculationViewSchema = z.enum(['open', 'closed', 'all'])

export const dailyCalculationPersonMoneySchema = z.object({
  personName: z.string().trim().min(1),
  amount: z.number().int().positive(),
  remarks: z.string().trim().optional(),
})

function hasValidPeriod(data: {
  periodStart?: Date
  periodEnd?: Date
}) {
  if (data.periodStart == null || data.periodEnd == null) return true
  return data.periodStart.getTime() <= data.periodEnd.getTime()
}

const periodOrderIssue = {
  message: 'Period start must be on or before period end.',
  path: ['periodEnd'],
}

// Client-entered fields only. Automatic totals (asol, sudh, deoya,
// personMoneyTotal, leftTotal, rightTotal, difference, balanceStatus) are
// server-calculated and must not be accepted from the client.
// Overlapping periods are validated in the service layer, not here.
export const createDailyCalculationSchema = z
  .object({
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    tabil: z.number().int().nonnegative(),
    cashInHome: z.number().int().nonnegative(),
    cashInShop: z.number().int().nonnegative(),
    personMoneyEntries: z
      .array(dailyCalculationPersonMoneySchema)
      .default([]),
  })
  .refine(hasValidPeriod, periodOrderIssue)

export const updateDailyCalculationSchema = z
  .object({
    id: z.string().min(1),
    periodStart: z.coerce.date().optional(),
    periodEnd: z.coerce.date().optional(),
    tabil: z.number().int().nonnegative().optional(),
    cashInHome: z.number().int().nonnegative().optional(),
    cashInShop: z.number().int().nonnegative().optional(),
    personMoneyEntries: z.array(dailyCalculationPersonMoneySchema).optional(),
  })
  .refine(hasValidPeriod, periodOrderIssue)

export const dailyCalculationIdSchema = z.object({
  id: z.string().min(1),
})

export const closeDailyCalculationSchema = z.object({
  id: z.string().min(1),
  closedAt: z.coerce.date().optional(),
})

export const listDailyCalculationSchema = z.object({
  recordStatus: dailyCalculationRecordStatusSchema.optional(),
  balanceStatus: dailyCalculationBalanceStatusSchema.optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  ...listPaginationSchema.shape,
})

export const dailyCalculationSearchSchema = z.object({
  view: dailyCalculationViewSchema.default('open'),
  balanceStatus: dailyCalculationBalanceStatusSchema.optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
})
