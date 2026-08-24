import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'

export const interestSourceSchema = z.enum([
  'jinis',
  'jinischara',
  'person',
  'all',
])

function hasInterestTarget(data: {
  jinisId?: string | null
  jinisCharaId?: string | null
  personName?: string | null
}) {
  return Boolean(data.jinisId || data.jinisCharaId || data.personName)
}

export const createInterestSchema = z
  .object({
    amount: z.number().int().positive(),
    date: z.coerce.date(),
    remarks: z.string().trim().optional(),
    jinisId: z.string().trim().min(1).optional(),
    jinisCharaId: z.string().trim().min(1).optional(),
    personName: z.string().trim().optional(),
    settle: z.boolean().optional().default(false),
  })
  .refine(hasInterestTarget, {
    message: 'Link this Interest to a Jinis, JinisChara, or person.',
  })
  .refine((data) => !data.settle || Boolean(data.jinisId || data.jinisCharaId), {
    message: 'Settled can only be used when linked to a Jinis or JinisChara.',
    path: ['settle'],
  })

export const updateInterestSchema = z.object({
  id: z.string().min(1),
  amount: z.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  remarks: z.string().trim().nullable().optional(),
  jinisId: z.string().trim().min(1).nullable().optional(),
  jinisCharaId: z.string().trim().min(1).nullable().optional(),
  personName: z.string().trim().nullable().optional(),
})

export const interestIdSchema = z.object({
  id: z.string().min(1),
})

export const listInterestSchema = z.object({
  jinisId: z.string().trim().optional(),
  jinisCharaId: z.string().trim().optional(),
  personName: z.string().trim().optional(),
  amountMin: z.number().int().nonnegative().optional(),
  amountMax: z.number().int().nonnegative().optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  source: interestSourceSchema.optional(),
  ...listPaginationSchema.shape,
})

export const interestSearchSchema = z.object({
  source: interestSourceSchema.default('all'),
  jinisId: z.string().trim().optional(),
  jinisCharaId: z.string().trim().optional(),
  personName: z.string().trim().optional(),
  amountMin: z.coerce.number().int().nonnegative().optional(),
  amountMax: z.coerce.number().int().nonnegative().optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
})
