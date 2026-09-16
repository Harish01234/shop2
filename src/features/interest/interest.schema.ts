import { z } from 'zod'

import { listPaginationSchema } from '#/lib/pagination'
import {
  calendarDateField,
  optionalCalendarDateField,
  optionalNullableText,
  optionalText,
  requiredNonNegativeInt,
  requiredText,
} from '#/lib/form-schema'

export const interestSourceSchema = z.enum([
  'jinis',
  'jinischara',
  'person',
  'all',
])

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined
  return value
}

function emptyToNull(value: unknown) {
  if (value === '' || value === undefined) return null
  return value
}

function hasInterestTarget(data: {
  jinisId?: string | null
  jinisCharaId?: string | null
  personName?: string | null
}) {
  return Boolean(data.jinisId || data.jinisCharaId || data.personName)
}

export const createInterestSchema = z
  .object({
    amount: requiredNonNegativeInt(
      'Enter amount',
      'Amount must be a whole number 0 or greater',
    ),
    date: calendarDateField,
    remarks: optionalText,
    jinisId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1, 'Choose a Jinis').optional(),
    ),
    jinisCharaId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1, 'Choose a JinisChara').optional(),
    ),
    personName: z.preprocess(emptyToUndefined, requiredText('Enter a name').optional()),
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
  amount: requiredNonNegativeInt(
    'Enter amount',
    'Amount must be a whole number 0 or greater',
  ).optional(),
  date: optionalCalendarDateField,
  remarks: optionalNullableText,
  jinisId: z.preprocess(
    emptyToNull,
    z.string().trim().min(1).nullable().optional(),
  ),
  jinisCharaId: z.preprocess(
    emptyToNull,
    z.string().trim().min(1).nullable().optional(),
  ),
  personName: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
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

export const deleteAllInterestSchema = listInterestSchema.omit({
  page: true,
  pageSize: true,
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

export const interestImportPreviewInputSchema = z.object({
  fileName: z.string().trim().min(1),
  content: z.string().min(1),
  encoding: z.enum(['utf8', 'base64']),
})

export const interestImportRowSchema = z
  .object({
    amount: requiredNonNegativeInt(
      'Enter amount',
      'Amount must be a whole number 0 or greater',
    ),
    date: calendarDateField,
    jinisId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional(),
    ),
    personName: z.preprocess(
      emptyToUndefined,
      requiredText('Enter a name').optional(),
    ),
    settle: z.boolean(),
  })
  .refine((data) => Boolean(data.jinisId || data.personName), {
    message: 'Link this Interest to a Jinis or person.',
  })
  .refine((data) => !data.settle || Boolean(data.jinisId), {
    message: 'Settled can only be used when linked to a Jinis.',
    path: ['settle'],
  })

export const interestImportSchema = z.object({
  rows: z.array(interestImportRowSchema).min(1).max(5000),
})
