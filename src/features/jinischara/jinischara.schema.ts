import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'
import {
  calendarDateField,
  optionalCalendarDateField,
  optionalNonNegativeNumber,
  optionalNullableText,
  optionalText,
  requiredPositiveInt,
  requiredText,
} from '#/lib/form-schema'
import { DEFAULT_JINISCHARA_PERCENTAGE } from './jinischara.utils'

export const createJinisCharaSchema = z.object({
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
  percentage: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return DEFAULT_JINISCHARA_PERCENTAGE
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : DEFAULT_JINISCHARA_PERCENTAGE
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed)
        ? parsed
        : DEFAULT_JINISCHARA_PERCENTAGE
    }
    return DEFAULT_JINISCHARA_PERCENTAGE
  }, z.number().nonnegative('Enter a number 0 or greater')),
  description: optionalText,
  date: calendarDateField,
  active: z.boolean().default(true),
})

export const updateJinisCharaSchema = z.object({
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
  percentage: optionalNonNegativeNumber,
  description: optionalNullableText,
  date: optionalCalendarDateField,
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
