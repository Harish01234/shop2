import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'
import {
  calendarDateField,
  optionalCalendarDateField,
  requiredPositiveInt,
  requiredPositiveNumber,
  requiredText,
} from '#/lib/form-schema'

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
  name: requiredText('Enter an item name'),
  wet: requiredPositiveNumber('Enter weight', 'Weight must be greater than 0'),
  type: jinisItemTypeSchema,
})

export const createJinisSchema = z.object({
  slNo: requiredPositiveInt(
    'Enter serial no',
    'Serial no must be a whole number greater than 0',
  ),
  name: requiredText('Enter a name'),
  fatherName: requiredText('Enter father name'),
  phoneNo: requiredText('Enter phone number'),
  credit: requiredPositiveInt(
    'Enter credit',
    'Credit must be a whole number greater than 0',
  ),
  type: jinisTypeSchema,
  date: calendarDateField,
  active: z.boolean().default(true),
  items: z
    .array(jinisItemSchema)
    .min(1, 'Add at least one item'),
})

export const updateJinisSchema = z.object({
  id: z.string().min(1),
  slNo: requiredPositiveInt(
    'Enter serial no',
    'Serial no must be a whole number greater than 0',
  ).optional(),
  name: requiredText('Enter a name').optional(),
  fatherName: requiredText('Enter father name').optional(),
  phoneNo: requiredText('Enter phone number').optional(),
  credit: requiredPositiveInt(
    'Enter credit',
    'Credit must be a whole number greater than 0',
  ).optional(),
  type: jinisTypeSchema.optional(),
  date: optionalCalendarDateField,
  active: z.boolean().optional(),
  settledAt: z.coerce.date().nullable().optional(),
  items: z.array(jinisItemSchema).min(1, 'Add at least one item').optional(),
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
