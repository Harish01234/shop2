import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { requireAdminMiddleware } from '#/lib/auth-middleware'
import {
  createMainCalculationSchema,
  listAvailableDailyCalculationsSchema,
  listMainCalculationSchema,
  mainCalculationIdSchema,
  previewMainCalculationSchema,
  updateMainCalculationSchema,
} from './maincalculation.schema'
import {
  createMainCalculationRecord,
  deleteMainCalculationRecord,
  finalizeMainCalculationRecord,
  getMainCalculationRecord,
  listAvailableDailyCalculations,
  listMainCalculationRecords,
  previewMainCalculationTotals,
  refreshMainCalculationTotalsRecord,
  updateMainCalculationRecord,
} from './maincalculation.server'

export const listMainCalculation = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .validator(listMainCalculationSchema)
  .handler(async ({ data }) => listMainCalculationRecords(data))

export const getMainCalculation = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .validator(mainCalculationIdSchema)
  .handler(async ({ data }) => {
    const record = await getMainCalculationRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const refreshMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(mainCalculationIdSchema)
  .handler(async ({ data, context }) => {
    const record = await refreshMainCalculationTotalsRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const listAvailableDailyCalculationsForMainCalc = createServerFn({
  method: 'POST',
})
  .middleware([requireAdminMiddleware])
  .validator(listAvailableDailyCalculationsSchema)
  .handler(async ({ data }) => listAvailableDailyCalculations(data))

export const previewMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(previewMainCalculationSchema)
  .handler(async ({ data }) => previewMainCalculationTotals(data))

export const createMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(createMainCalculationSchema)
  .handler(async ({ data, context }) =>
    createMainCalculationRecord(data, context.session.user.id),
  )

export const updateMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(updateMainCalculationSchema)
  .handler(async ({ data, context }) => {
    const record = await updateMainCalculationRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const finalizeMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(mainCalculationIdSchema)
  .handler(async ({ data, context }) => {
    const record = await finalizeMainCalculationRecord(
      data,
      context.session.user.id,
    )

    if (!record) {
      throw notFound()
    }

    return record
  })

export const deleteMainCalculation = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(mainCalculationIdSchema)
  .handler(async ({ data }) => {
    const result = await deleteMainCalculationRecord(data)

    if (!result) {
      throw notFound()
    }

    return result
  })
