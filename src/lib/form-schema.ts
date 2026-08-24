import { z } from 'zod'

import { parseDateInput, toDateInput } from './calendar-date'

function blankToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined
  if (typeof value === 'number' && Number.isNaN(value)) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

function toFiniteNumber(value: unknown) {
  const next = blankToUndefined(value)
  if (next === undefined) return undefined
  if (typeof next === 'number') {
    return Number.isFinite(next) ? next : undefined
  }
  if (typeof next === 'string') {
    const parsed = Number(next)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export const requiredText = (message: string) =>
  z.string({ error: message }).trim().min(1, message)

export const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)

export const optionalNullableText = z
  .string()
  .nullable()
  .optional()
  .transform((value) => {
    if (value == null) return value
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  })

export const requiredPositiveInt = (emptyMessage: string, invalidMessage = emptyMessage) =>
  z.preprocess(
    toFiniteNumber,
    z
      .number({ error: emptyMessage })
      .int(invalidMessage)
      .positive(invalidMessage),
  )

export const requiredNonNegativeInt = (
  emptyMessage: string,
  invalidMessage = emptyMessage,
) =>
  z.preprocess(
    toFiniteNumber,
    z
      .number({ error: emptyMessage })
      .int(invalidMessage)
      .nonnegative(invalidMessage),
  )

export const requiredPositiveNumber = (
  emptyMessage: string,
  invalidMessage = emptyMessage,
) =>
  z.preprocess(
    toFiniteNumber,
    z.number({ error: emptyMessage }).positive(invalidMessage),
  )

export const optionalNonNegativeNumber = z.preprocess((value) => {
  const next = blankToUndefined(value)
  if (next === undefined) return undefined
  return toFiniteNumber(next)
}, z.number().nonnegative('Enter a number 0 or greater').optional())

export const calendarDateField = z.preprocess((value) => {
  if (value instanceof Date) {
    const day = toDateInput(value)
    return day || undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  return undefined
}, z.string({ error: 'Choose a date' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date').transform((day) => parseDateInput(day)))

export const optionalCalendarDateField = z.preprocess((value) => {
  if (value == null || value === '') return undefined
  if (value instanceof Date) {
    const day = toDateInput(value)
    return day || undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  return undefined
}, z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date')
  .transform((day) => parseDateInput(day))
  .optional())
