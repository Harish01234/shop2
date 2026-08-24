import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'
import {
  calendarDateField,
  optionalCalendarDateField,
  optionalText,
  requiredNonNegativeInt,
} from '#/lib/form-schema'

export const dailyCalculationRecordStatusSchema = z.enum(['OPEN', 'CLOSED'])

export const dailyCalculationBalanceStatusSchema = z.enum([
  'CORRECT',
  'INCORRECT',
])

export const dailyCalculationViewSchema = z.enum(['open', 'closed', 'all'])

export const dailyCalculationPersonMoneySchema = z
  .object({
    personName: z.string().trim(),
    amount: z.preprocess((value) => {
      if (value === '' || value === null || value === undefined) return 0
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }, z
      .number({ error: 'Enter amount' })
      .int('Amount must be a whole number 0 or greater')
      .nonnegative('Amount must be a whole number 0 or greater')),
    remarks: optionalText,
  })
  .superRefine((entry, ctx) => {
    const hasName = Boolean(entry.personName)
    const hasAmount = entry.amount > 0
    if (!hasName && !hasAmount) return

    if (!hasName) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a name',
        path: ['personName'],
      })
    }

    if (!hasAmount) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter amount',
        path: ['amount'],
      })
    }
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

function filledPersonMoneyEntries(
  entries: Array<{
    personName: string
    amount: number
    remarks?: string
  }>,
) {
  return entries.filter((entry) => entry.personName && entry.amount > 0)
}

// Client-entered fields only. Automatic totals (asol, sudh, deoya,
// personMoneyTotal, leftTotal, rightTotal, difference, balanceStatus) are
// server-calculated and must not be accepted from the client.
// Overlapping periods are validated in the service layer, not here.
export const createDailyCalculationSchema = z
  .object({
    periodStart: calendarDateField,
    periodEnd: calendarDateField,
    tabil: requiredNonNegativeInt(
      'Enter Tabil',
      'Tabil must be a whole number 0 or greater',
    ),
    cashInHome: requiredNonNegativeInt(
      'Enter cash in home',
      'Cash in home must be a whole number 0 or greater',
    ),
    cashInShop: requiredNonNegativeInt(
      'Enter cash in shop',
      'Cash in shop must be a whole number 0 or greater',
    ),
    personMoneyEntries: z
      .array(dailyCalculationPersonMoneySchema)
      .default([])
      .transform(filledPersonMoneyEntries),
  })
  .refine(hasValidPeriod, periodOrderIssue)

export const updateDailyCalculationSchema = z
  .object({
    id: z.string().min(1),
    periodStart: optionalCalendarDateField,
    periodEnd: optionalCalendarDateField,
    tabil: requiredNonNegativeInt(
      'Enter Tabil',
      'Tabil must be a whole number 0 or greater',
    ).optional(),
    cashInHome: requiredNonNegativeInt(
      'Enter cash in home',
      'Cash in home must be a whole number 0 or greater',
    ).optional(),
    cashInShop: requiredNonNegativeInt(
      'Enter cash in shop',
      'Cash in shop must be a whole number 0 or greater',
    ).optional(),
    personMoneyEntries: z
      .array(dailyCalculationPersonMoneySchema)
      .transform(filledPersonMoneyEntries)
      .optional(),
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
