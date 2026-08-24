import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'
import { DEFAULT_JINISCHARA_PERCENTAGE } from './jinischara.utils'

export const createJinisCharaSchema = z.object({
  slNo: z.number().int().positive(),
  name: z.string().trim().min(1),
  fatherName: z.string().trim().min(1),
  phoneNo: z.string().trim().min(1),
  credit: z.number().int().positive(),
  percentage: z
    .number()
    .nonnegative()
    .optional()
    .default(DEFAULT_JINISCHARA_PERCENTAGE),
  description: z.string().trim().optional(),
  date: z.coerce.date(),
  active: z.boolean().default(true),
})

export const updateJinisCharaSchema = z.object({
  id: z.string().min(1),

  slNo: z.number().int().positive().optional(),
  name: z.string().trim().min(1).optional(),
  fatherName: z.string().trim().min(1).optional(),
  phoneNo: z.string().trim().min(1).optional(),
  credit: z.number().int().positive().optional(),
  percentage: z.number().nonnegative().optional(),
  description: z.string().trim().nullable().optional(),
  date: z.coerce.date().optional(),
  active: z.boolean().optional(),
  settledAt: z.coerce.date().nullable().optional(),
})

export const jinisCharaIdSchema = z.object({
  id: z.string().min(1),
})

export const jinisCharaViewSchema = z.enum(['open', 'settled', 'all'])

export const listJinisCharaSchema = z.object({
  active: z.boolean().optional(),
  slNo: z.string().trim().optional(),
  name: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  creditMin: z.number().int().nonnegative().optional(),
  creditMax: z.number().int().nonnegative().optional(),
  percentageMin: z.number().nonnegative().optional(),
  percentageMax: z.number().nonnegative().optional(),
  phoneNo: z.string().trim().optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  ...listPaginationSchema.shape,
})

export const jinisCharaSearchSchema = z.object({
  view: jinisCharaViewSchema.default('open'),
  slNo: z.string().trim().optional(),
  name: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  creditMin: z.coerce.number().int().nonnegative().optional(),
  creditMax: z.coerce.number().int().nonnegative().optional(),
  percentageMin: z.coerce.number().nonnegative().optional(),
  percentageMax: z.coerce.number().nonnegative().optional(),
  phoneNo: z.string().trim().optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
})

export const settleJinisCharaSchema = z.object({
  id: z.string().min(1),
  settledAt: z.coerce.date().optional(),
})
