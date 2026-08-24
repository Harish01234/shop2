import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'

export const mainCalculationRecordStatusSchema = z.enum(['DRAFT', 'FINALIZED'])

export const mainCalculationBalanceStatusSchema = z.enum(['CORRECT', 'INCORRECT'])

export const mainCalculationViewSchema = z.enum(['draft', 'finalized', 'all'])

// Client-entered fields only. Automatic totals are server-calculated.
export const mainCalculationInputSchema = z.object({
  calculationDate: z.coerce.date(),
  totalTabil: z.number().int().nonnegative(),
  dailyCalculationId: z.string().min(1),
})

export const createMainCalculationSchema = mainCalculationInputSchema

export const updateMainCalculationSchema = z.object({
  id: z.string().min(1),
  calculationDate: z.coerce.date().optional(),
  totalTabil: z.number().int().nonnegative().optional(),
  dailyCalculationId: z.string().min(1).optional(),
})

export const previewMainCalculationSchema = mainCalculationInputSchema.extend({
  excludeMainCalculationId: z.string().min(1).optional(),
})

export const mainCalculationIdSchema = z.object({
  id: z.string().min(1),
})

export const listAvailableDailyCalculationsSchema = z
  .object({
    excludeMainCalculationId: z.string().min(1).optional(),
  })
  .default({})

export const listMainCalculationSchema = z
  .object({
    recordStatus: mainCalculationRecordStatusSchema.optional(),
    balanceStatus: mainCalculationBalanceStatusSchema.optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    ...listPaginationSchema.shape,
  })
  .default({})

export const mainCalculationSearchSchema = z.object({
  view: mainCalculationViewSchema.default('draft'),
  balanceStatus: mainCalculationBalanceStatusSchema.optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
})
