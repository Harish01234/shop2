import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'

export const jinisTypeSchema = z.enum([
  'GOLD',
  'SILVER',
  'BOTH',
  'UNKNOWN',
])

export const jinisItemTypeSchema = z.enum([
  'GOLD',
  'SILVER',
])

export const jinisItemSchema = z.object({
  name: z.string().trim().min(1),
  wet: z.number().positive(),
  type: jinisItemTypeSchema,
})

export const createJinisSchema = z.object({
  slNo: z.number().int().positive(),
  name: z.string().trim().min(1),
  fatherName: z.string().trim().min(1),
  phoneNo: z.string().trim().min(1),
  credit: z.number().int().positive(),
  type: jinisTypeSchema,
  date: z.coerce.date(),
  active: z.boolean().default(true),
  items: z.array(jinisItemSchema).min(1),
})

export const updateJinisSchema = z.object({
  id: z.string().min(1),

  slNo: z.number().int().positive().optional(),
  name: z.string().trim().min(1).optional(),
  fatherName: z.string().trim().min(1).optional(),
  phoneNo: z.string().trim().min(1).optional(),
  credit: z.number().int().positive().optional(),
  type: jinisTypeSchema.optional(),
  date: z.coerce.date().optional(),
  active: z.boolean().optional(),
  settledAt: z.coerce.date().nullable().optional(),
  items: z.array(jinisItemSchema).min(1).optional(),
})

export const jinisIdSchema = z.object({
  id: z.string().min(1),
})

export const jinisViewSchema = z.enum(['open', 'settled', 'all'])

export const listJinisSchema = z.object({
  active: z.boolean().optional(),
  slNo: z.string().trim().optional(),
  name: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  creditMin: z.number().int().nonnegative().optional(),
  creditMax: z.number().int().nonnegative().optional(),
  phoneNo: z.string().trim().optional(),
  type: jinisTypeSchema.optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  ...listPaginationSchema.shape,
})

export const jinisSearchSchema = z.object({
  view: jinisViewSchema.default('open'),
  slNo: z.string().trim().optional(),
  name: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  creditMin: z.coerce.number().int().nonnegative().optional(),
  creditMax: z.coerce.number().int().nonnegative().optional(),
  phoneNo: z.string().trim().optional(),
  type: jinisTypeSchema.optional(),
  date: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
})

export const settleJinisSchema = z.object({
  id: z.string().min(1),
  settledAt: z.coerce.date().optional(),
})

