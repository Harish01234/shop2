import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { requireUserMiddleware } from '#/lib/auth-middleware'
import {
  closeDailyCalculationSchema,
  createDailyCalculationSchema,
  dailyCalculationIdSchema,
  listDailyCalculationSchema,
  updateDailyCalculationSchema,
} from './dailycalculation.schema'
import {
  closeDailyCalculationRecord,
  createDailyCalculationRecord,
  deleteDailyCalculationRecord,
  getDailyCalculationRecord,
  getDailyCalculationDetailRecord,
  listDailyCalculationRecords,
  previewDailyCalculationTotals,
  refreshDailyCalculationTotalsRecord,
  updateDailyCalculationRecord,
} from './dailycalculation.server'

export const listDailyCalculation = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(listDailyCalculationSchema)
  .handler(async ({ data }) => listDailyCalculationRecords(data))

export const getDailyCalculation = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(dailyCalculationIdSchema)
  .handler(async ({ data }) => {
    const record = await getDailyCalculationRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const getDailyCalculationDetail = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(dailyCalculationIdSchema)
  .handler(async ({ data }) => {
    const detail = await getDailyCalculationDetailRecord(data)

    if (!detail) {
      throw notFound()
    }

    return detail
  })

export const refreshDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(dailyCalculationIdSchema)
  .handler(async ({ data, context }) => {
    const record = await refreshDailyCalculationTotalsRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const previewDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(createDailyCalculationSchema)
  .handler(async ({ data }) => previewDailyCalculationTotals(data))

export const createDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(createDailyCalculationSchema)
  .handler(async ({ data, context }) =>
    createDailyCalculationRecord(data, context.session.user.id),
  )

export const updateDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(updateDailyCalculationSchema)
  .handler(async ({ data, context }) => {
    const record = await updateDailyCalculationRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const closeDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(closeDailyCalculationSchema)
  .handler(async ({ data, context }) => {
    const record = await closeDailyCalculationRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const deleteDailyCalculation = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(dailyCalculationIdSchema)
  .handler(async ({ data }) => {
    const result = await deleteDailyCalculationRecord(data)

    if (!result) {
      throw notFound()
    }

    return result
  })
